import {set as _set} from 'lodash';
import {
    ArrayContainedBy,
    ArrayContains, ArrayOverlap,
    Between, Brackets, ILike, In,
    IsNull, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual, Not, QueryBuilder
} from '@steroidsjs/typeorm';
import {SelectQueryBuilder} from '@steroidsjs/typeorm/query-builder/SelectQueryBuilder';
import {QueryAdapterTypeORM} from '../../adapters/QueryAdapterTypeORM';
import SearchQuery from '../../../usecases/base/SearchQuery';
import {getMetaPrimaryKey} from '../../decorators/fields/BaseField';
import {ObjectToArray} from '../../../usecases/helpers/ObjectToArray';

export type IConditionOperatorSingle = '=' | '>' | '>=' | '=>' | '<' | '<=' | '=<' | 'like' | 'ilike' | 'between'
    | 'in' | 'and' | '&&' | 'or' | '||' | 'not =' | 'not >' | 'not >=' | 'not =>' | 'not <' | 'not <=' | 'not =<'
    | 'not like' | 'not ilike' | 'not between' | 'not in' | 'not and' | 'not &&' | 'not or' | 'not ||' | '@>'
    | 'not @>' | '<@' | 'not <@' | 'overlap' | 'not overlap';
export type IConditionOperatorAndOr = 'and' | '&&' | 'or' | '||' | 'not and' | 'not &&' | 'not or' | 'not ||';
export type IConditionOperatorSubquery = 'some' | 'every' | 'none';
export type ICondition = Record<string, unknown>
    | [IConditionOperatorAndOr, ...any[]]
    | ['filter', ICondition]
    | [IConditionOperatorSingle, string, ...any[]]
    | [IConditionOperatorSubquery, string | string[], ICondition]
    | ICondition[];

const emptyCondition = {};
const isEmpty = value => value === null || typeof value === 'undefined' || value === emptyCondition || value === '';

const STEROIDS_SUBQUERY_PARAMS_KEY = 'steroids_subquery_params_key'

export class ConditionHelperTypeORM {

    static toTypeOrm(
        condition: ICondition,
        dbQuery: SelectQueryBuilder<any>,
        rootClass: any,
    ) {
        return ConditionHelperTypeORM._toTypeOrmInternal(condition, dbQuery, rootClass);
    }

    static _objectConditionToArray(condition: ICondition) {
        if (typeof condition === 'object' && !Array.isArray(condition)) {
            return [
                'and',
                ...ObjectToArray(condition)
                    .map(array => ['=', ...array]),
            ];
        }
        if (Array.isArray(condition)) {
            return condition;
        }
        throw new Error('condition is not object');
    }

    static _reverseCondition(condition: ICondition) {
        if (Array.isArray(condition)) {
            const operator = condition[0];
            if (typeof operator === 'string' && operator.startsWith('not')) {
                return [operator.slice(4), ...condition.slice(1)];
            }
            return [`not ${operator}`, ...condition.slice(1)];
        }
        throw new Error('condition is not array');
    }

    static _toTypeOrmInternal(
        condition: ICondition,
        dbQuery: SelectQueryBuilder<any>,
        rootClass: any,
        filterEmpty = false,
    ) {
        // {key: value, ...} -> ['and', ['=', key, value], ...]
        if (typeof condition === 'object' && !Array.isArray(condition)) {
            return ConditionHelperTypeORM._toTypeOrmInternal(
                this._objectConditionToArray(condition),
                dbQuery,
                rootClass,
                filterEmpty
            );
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
                case 'filter': // ['filter', condition]
                    return ConditionHelperTypeORM._toTypeOrmInternal(
                        condition[1],
                        dbQuery,
                        rootClass,
                        true);

                case '=': // ['=', 'age', 18]
                    return objectWhere(isNot, isEmpty(value), key, isEmpty(value) ? IsNull() : value);

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
                        likeMethod( value ? (value.indexOf('%') !== -1 ? value : '%' + value + '%') : '')
                    );

                case 'between': // ['between', 'size', 5, 10]
                    return objectWhere(isNot, isEmpty(condition[2] || condition[3]), key, Between(condition[2], condition[3]));

                case 'in': // ['in', 'ids', [5, 6, 10]]
                    if (value && !Array.isArray(value)) {
                        throw Error('Wrong value for IN operator: ' + JSON.stringify(value));
                    }
                    return objectWhere(isNot, isEmpty(value) || value.length === 0, key, In(value));

                case '@>': // ['contains', 'codes', ['someCode', 'someCode2']]
                    return objectWhere(isNot, isEmpty(value), key, ArrayContains([].concat(value)));

                case '<@': // ['containedBy', 'codes', ['someCode', 'someCode2']]
                    return objectWhere(isNot, isEmpty(value), key, ArrayContainedBy([].concat(value)));

                case 'overlap': // ['overlap', 'codes', ['someCode', 'someCode2']]
                    return objectWhere(isNot, isEmpty(value), key, ArrayOverlap([].concat(value)));

                case 'some':  // ['some', 'applications', ['=', 'applications.id', 2']]
                case 'every': // ['every', 'applications', ['=', 'applications.id', 2']]
                case 'none':  // ['none', 'applications', ['=', 'applications.id', 2']]
                    if (isNot) {
                        throw Error(`Unsupport NOT for ${operator} operator.`);
                    }
                    const primaryKey = getMetaPrimaryKey(rootClass);
                    const subQuery = dbQuery.connection.createQueryBuilder(rootClass, 'model');
                    subQuery.select(`model.${primaryKey}`);

                    const subSearchQuery = new SearchQuery();
                    subSearchQuery.with(condition[1]);
                    subSearchQuery.where(
                        operator === 'every'
                            ? this._reverseCondition(condition[2])
                            : condition[2],
                    );
                    subSearchQuery.andWhere(['not =', 'id', null]);

                    QueryAdapterTypeORM.prepare(
                        dbQuery.connection.getRepository(rootClass),
                        subQuery,
                        subSearchQuery,
                        false,
                    );

                    const subqueryParams = dbQuery.getParameters()[STEROIDS_SUBQUERY_PARAMS_KEY];
                    dbQuery.setParameter(
                        STEROIDS_SUBQUERY_PARAMS_KEY,
                        subqueryParams ? subqueryParams + 1 : 1,
                    );
                    const paramsKey = dbQuery.getParameters()[STEROIDS_SUBQUERY_PARAMS_KEY];
                    dbQuery.setParameters({
                        ...dbQuery.getParameters(),
                        ...(Object.entries(subQuery.getParameters()).reduce((params, param) => ({
                            ...params,
                            [`steroids_${paramsKey}_${param[0]}`]: param[1],
                        }), {}))
                    });

                    const subQueryString = subQuery.getQuery().replace(
                        /orm_param_/g,
                        `steroids_${paramsKey}_orm_param_`,
                    );

                    let resultCondition;
                    if (operator === 'some') {
                        resultCondition = `${dbQuery.alias}.${primaryKey} IN (${subQueryString})`;
                    } else {
                        resultCondition = `${dbQuery.alias}.${primaryKey} NOT IN (${subQueryString})`;
                    }

                    return new Brackets((qb: any) => {
                        qb.andWhere(resultCondition);
                    });
                case 'and': // ['and', {isActive: true}, ['=', 'name', 'Ivan']]
                case '&&':
                case 'or': // ['or', {isAdmin: true}, ['=', 'name', 'Ivan']]
                case '||':
                    let isOr = ['or', '||'].includes(operator);

                    if (isNot) {
                        isOr = !isOr;
                    }

                    const values = condition.slice(1)
                        .map(item => typeof item === 'object' && !Array.isArray(item)
                            ? this._objectConditionToArray(item)
                            : item)
                        .map(item => ConditionHelperTypeORM._toTypeOrmInternal(
                                isNot ? this._reverseCondition(item) : item,
                            dbQuery,
                            rootClass,
                            filterEmpty))
                        .filter(value => !isEmpty(value));

                    if (values.length === 0) {
                        return emptyCondition;
                    }
                    if (values.length === 1) {
                        return values[0];
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

        if (!condition) {
            return emptyCondition;
        }

        throw Error('Wrong condition: ' + JSON.stringify(condition));
    }
}
