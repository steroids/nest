import {set as _set} from 'lodash';
import {Between, Brackets, ILike, In, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual, Not, QueryBuilder} from 'typeorm';
import {WhereExpressionBuilder} from 'typeorm/query-builder/WhereExpressionBuilder';

export type IConditionOperatorSingle = '=' | '>' | '>=' | '=>' | '<' | '<=' | '=<' | 'like' | 'ilike'
    | 'between' | 'in' | 'and' | '&&' | 'or' | '||';
export type IConditionOperatorAndOr = 'and' | '&&' | 'or' | '||';
export type ICondition = Record<string, unknown>
    | [IConditionOperatorAndOr, ...any[]]
    | [IConditionOperatorSingle, string, ...any[]]
    | ICondition[]
    | ((qb: WhereExpressionBuilder) => any);

const emptyCondition = {};
const isEmpty = value => value === null || typeof value === 'undefined' || value === emptyCondition;

export class ConditionHelper {
    static toTypeOrmFilter(condition: ICondition) {
        return ConditionHelper.toTypeOrm(condition, true);
    }

    static toTypeOrm(condition: ICondition, filterEmpty = false) {
        // TODO Вероятно стоит убрать это, чтобы не было соблазна использовать в сервисах
        if (typeof condition === 'function') {
            return new Brackets(condition);
        }

        // {key: value, ...}
        if (typeof condition === 'object' && !Array.isArray(condition)) {
            const result = Object.keys(condition).reduce((obj, key) => {
                const value = (condition as any)[key];
                if (!filterEmpty || !isEmpty(value)) {
                    _set(obj, key, value)
                }
                return obj;
            }, {});
            return Object.keys(result).length === 0 ? emptyCondition : result;
        }

        if (Array.isArray(condition) && condition.length > 1 && typeof condition[0] === 'string') {
            let operator = condition[0].toLowerCase();

            // ['not', {role: 'admin'}]
            const isNot = operator.indexOf('not') === 0;
            if (isNot) {
                operator = operator.replace(/^not\s+/, '');
            }

            const objectWhere = (isNot, isEmpty, key, value) => {
                return !filterEmpty || !isEmpty
                    ? _set({}, key, isNot ? Not(value) : value)
                    : emptyCondition;
            };

            const key = condition[1] as string;
            const value = condition[2];
            switch (operator) {
                case '=': // ['=', 'age', 18]
                    return objectWhere(isNot, isEmpty(value), key, value);

                case '>': // ['>', 'age', 18]
                    return objectWhere(isNot, isEmpty(value), key, MoreThan(value));

                case '>=': // ['>=', 'age', 18]
                case '=>':
                    return objectWhere(isNot, isEmpty(value), key, MoreThanOrEqual(value));

                case '<': // ['<', 'age', 18]
                    return objectWhere(isNot, isEmpty(value), key, LessThan(value));

                case '<=': // ['<=', 'age', 18]
                case '=<':
                    return objectWhere(isNot, isEmpty(value), key, LessThanOrEqual(value));

                case 'like': // ['like', 'name', 'alex']
                case 'ilike': // ['ilike', 'name', 'alex']
                    const likeMethod = operator === 'ilike' ? ILike : Like;
                    return objectWhere(
                        isNot,
                        isEmpty(value),
                        key,
                        likeMethod(value.indexOf('%') !== -1 ? value : '%' + value + '%')
                    );

                case 'between': // ['between', 'size', 5, 10]
                    return objectWhere(isNot, isEmpty(condition[2] || condition[3]), key, Between(condition[2], condition[3]));

                case 'in': // ['in', 'ids', [5, 6, 10]]
                    if (value && !Array.isArray(value)) {
                        throw Error('Wrong value for IN operator: ' + JSON.stringify(value));
                    }
                    return objectWhere(isNot, isEmpty(value) || value.length === 0, key, In(value));

                case 'and': // ['and', {isActive: true}, ['=', 'name', 'Ivan']]
                case '&&':
                case 'or': // ['or', {isAdmin: true}, ['=', 'name', 'Ivan']]
                case '||':
                    if (isNot) {
                        throw Error('Unsupport NOT for AND/OR operator. Operator: ' + operator);
                    }

                    const isOr = ['or', '||'].includes(operator);
                    const values = condition.slice(1)
                        .map(item => ConditionHelper.toTypeOrm(item, filterEmpty))
                        .filter(value => !isEmpty(value));

                    if (values.length === 0) {
                        return emptyCondition;
                    }

                    return new Brackets((query2: any) => {
                        const parentQuery: QueryBuilder<any> = query2.parentQueryBuilder;

                        // Hack for use relations
                        query2.expressionMap.joinAttributes = parentQuery.expressionMap.joinAttributes;

                        values.forEach(value => {
                            if (isOr) {
                                query2.orWhere(value);
                            } else {
                                query2.andWhere(value);
                            }
                        });
                    });

                default:
                    throw Error('Wrong operator: ' + operator);
            }
        }

        throw Error('Wrong condition: ' + JSON.stringify(condition));
    }
}
