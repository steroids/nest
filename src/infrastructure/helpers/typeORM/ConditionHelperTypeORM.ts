import {set as _set} from 'lodash';
import {
    ArrayContainedBy,
    ArrayContains, ArrayOverlap,
    Between, Brackets, ILike, In,
    IsNull, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual, Not, QueryBuilder, SelectQueryBuilder
} from 'typeorm';
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

            const objectWhere = (addNot: boolean, empty: boolean, key, value) => !filterEmpty || !empty
                ? _set({}, key, addNot ? Not(value) : value)
                : emptyCondition;

            const key = condition[1] as string;
            const value = condition[2];

            switch (operator) {
                // ['filter', condition]
                case 'filter':
                    return ConditionHelperTypeORM._toTypeOrmInternal(
                        condition[1],
                        dbQuery,
                        rootClass,
                        true);

                // ['=', 'age', 18]
                case '=':
                    return objectWhere(isNot, isEmpty(value), key, isEmpty(value) ? IsNull() : value);

                // ['>', 'age', 18]
                case '>':
                    return objectWhere(isNot, isEmpty(value), key, MoreThan(value));

                // ['>=', 'age', 18]
                case '>=':
                case '=>':
                    return objectWhere(isNot, isEmpty(value), key, MoreThanOrEqual(value));

                // ['<', 'age', 18]
                case '<':
                    return objectWhere(isNot, isEmpty(value), key, LessThan(value));

                // ['<=', 'age', 18]
                case '<=':
                case '=<':
                    return objectWhere(isNot, isEmpty(value), key, LessThanOrEqual(value));

                // ['like', 'name', 'alex']
                case 'like':
                case 'ilike':
                    const likeMethod = operator === 'ilike'
                        ? ILike
                        : Like;

                    return objectWhere(
                        isNot,
                        isEmpty(value),
                        key,
                        likeMethod( value ? (value.indexOf('%') !== -1 ? value : '%' + value + '%') : '')
                    );

                // ['between', 'size', 5, 10]
                case 'between':
                    return objectWhere(isNot, isEmpty(condition[2] || condition[3]), key, Between(condition[2], condition[3]));

                // ['in', 'ids', [5, 6, 10]]
                case 'in':
                    if (value && !Array.isArray(value)) {
                        throw Error('Wrong value for IN operator: ' + JSON.stringify(value));
                    }
                    return objectWhere(isNot, isEmpty(value) || value.length === 0, key, In(value));

                // ['@>', 'codes', ['someCode', 'someCode2']]
                case '@>':
                    return objectWhere(isNot, isEmpty(value), key, ArrayContains([].concat(value)));

                // ['<@', 'codes', ['someCode', 'someCode2']]
                case '<@':
                    return objectWhere(isNot, isEmpty(value), key, ArrayContainedBy([].concat(value)));

                // ['overlap', 'codes', ['someCode', 'someCode2']]
                case 'overlap':
                    return objectWhere(isNot, isEmpty(value), key, ArrayOverlap([].concat(value)));

                // ['some', 'applications', ['=', 'applications.id', 2']]
                case 'some':
                case 'every':
                case 'none':
                    if (isNot) {
                        throw Error(`Unsupport NOT for ${operator} operator.`);
                    }
                    const primaryKey = getMetaPrimaryKey(rootClass);
                    const subQuery = dbQuery.dataSource.createQueryBuilder(rootClass, 'model');
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
                        dbQuery.dataSource.getRepository(rootClass),
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

                // ['and', {isActive: true}, ['=', 'name', 'Ivan']]
                case 'and':
                case '&&':
                case 'or':
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
                        .filter((someValue: any) => !isEmpty(someValue));

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

                        values.forEach(someValue => {
                            if (isOr) {
                                query2.orWhere(someValue);
                            } else {
                                query2.andWhere(someValue);
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
