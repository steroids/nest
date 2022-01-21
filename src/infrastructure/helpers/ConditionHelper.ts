import {Between, Brackets, ILike, In, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual, Not} from 'typeorm';
import {WhereExpressionBuilder} from 'typeorm/query-builder/WhereExpressionBuilder';

export type IConditionOperatorSingle = '=' | '>' | '>=' | '=>' | '<' | '<=' | '=<' | 'like' | 'ilike'
    | 'between' | 'in' | 'and' | '&&' | 'or' | '||';
export type IConditionOperatorAndOr = 'and' | '&&' | 'or' | '||';
export type ICondition = Record<string, unknown>
    | [IConditionOperatorAndOr, ...any[]]
    | [IConditionOperatorSingle, string, ...any[]]
    | ICondition[]
    | ((qb: WhereExpressionBuilder) => any);

const notCondition = (isNot, condition) => isNot ? Not(condition) : condition;

export class ConditionHelper {
    static toTypeOrm(condition: ICondition) {
        if (typeof condition === 'function') {
            return new Brackets(condition);
        }

        if (typeof condition === 'object' && !Array.isArray(condition)) {
            return condition;
        }

        if (Array.isArray(condition) && condition.length > 1 && typeof condition[0] === 'string') {
            let operator = condition[0].toLowerCase();

            // ['not', {role: 'admin'}]
            const isNot = operator.indexOf('not') === 0;
            if (isNot) {
                operator = operator.replace(/^not\s+/, '');
            }

            const key = condition[1] as string;
            const value = condition[2];
            switch (operator) {
                case '=': // ['=', 'age', 18]
                    return {[key]: notCondition(isNot, value)};

                case '>': // ['>', 'age', 18]
                    return {[key]: notCondition(isNot, MoreThan(value))};

                case '>=': // ['>=', 'age', 18]
                case '=>':
                    return {[key]: notCondition(isNot, MoreThanOrEqual(value))};

                case '<': // ['<', 'age', 18]
                    return {[key]: notCondition(isNot, LessThan(value))};

                case '<=': // ['<=', 'age', 18]
                case '=<':
                    return {[key]: notCondition(isNot, LessThanOrEqual(value))};

                case 'like': // ['like', 'name', 'alex']
                    return {[key]: notCondition(isNot, Like(value))};

                case 'ilike': // ['ilike', 'name', 'alex']
                    return {[key]: notCondition(isNot, ILike(value))};

                case 'between': // ['between', 'size', 5, 10]
                    return {[key]: notCondition(isNot, Between(condition[2], condition[3]))};

                case 'in': // ['in', 'ids', [5, 6, 10]]
                    if (!Array.isArray(value)) {
                        throw Error('Wrong value for IN operator: ' + JSON.stringify(value));
                    }
                    return {[key]: notCondition(isNot, In(value))};

                case 'and': // ['and', {isActive: true}, ['=', 'name', 'Ivan']]
                case '&&':
                    if (isNot) {
                        throw Error('Unsupport NOT for AND operator. Operator: ' + operator);
                    }
                    return new Brackets(query2 => {
                        condition.slice(1).forEach(item => {
                            query2.andWhere(ConditionHelper.toTypeOrm(item));
                        });
                    });

                case 'or': // ['or', {isAdmin: true}, ['=', 'name', 'Ivan']]
                case '||':
                    if (isNot) {
                        throw Error('Unsupport NOT for OR operator. Operator: ' + operator);
                    }
                    return new Brackets(query2 => {
                        condition.slice(1).forEach(item => {
                            query2.orWhere(ConditionHelper.toTypeOrm(item));
                        });
                    });

                default:
                    throw Error('Wrong operator: ' + operator);
            }
        }

        throw Error('Wrong condition: ' + JSON.stringify(condition));
    }
}
