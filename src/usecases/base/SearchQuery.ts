import {trim as _trim} from 'lodash';
import {getSchemaSelectOptions} from '../../infrastructure/decorators/schema/SchemaSelect';
import {getMetaRelations} from '../../infrastructure/decorators/fields/BaseField';
import {ICondition} from '../../infrastructure/helpers/typeORM/ConditionHelperTypeORM';
import {wrapInDoubleQuotes} from '../utils/wrapInDoubleQuotes';

export type ISearchQueryOrder = { [key: string]: 'asc' | 'desc' }

export const DEFAULT_ALIAS = 'model';

export interface ISearchQueryConfig<TModel> {
    useShortAliases?: boolean,
    onGetOne?: (searchQuery: SearchQuery<TModel>) => Promise<TModel | null>,
    onGetMany?: (searchQuery: SearchQuery<TModel>) => Promise<Array<TModel>>,
}

export default class SearchQuery<TModel> {
    protected _select?: string[];
    protected _excludeSelect?: string[];
    protected _alias?: string;
    protected _relationsJoin?: Record<string, {
        alias: string,
        select: string | string[],
    }>;
    protected _relationsNoJoin?: Record<string, {
        alias: string,
        select: string | string[],
    }>;
    protected _condition?: ICondition;
    protected _orders?: ISearchQueryOrder;
    protected _limit?: number;
    protected _offset?: number;
    protected _useShortAliases: boolean;
    protected _withDeleted: boolean;
    protected _onGetOne: ISearchQueryConfig<TModel>['onGetOne'];
    protected _onGetMany: ISearchQueryConfig<TModel>['onGetMany'];

    constructor(config?: ISearchQueryConfig<TModel>) {
        this._useShortAliases = config?.useShortAliases;
        this._alias = DEFAULT_ALIAS;
        this._onGetOne = config?.onGetOne;
        this._onGetMany = config?.onGetMany;
    }

    static createFromSchema<TModel>(SchemaClass, config?: ISearchQueryConfig<TModel>): SearchQuery<TModel> {
        const searchQuery = new SearchQuery<TModel>(config);

        const options = getSchemaSelectOptions(SchemaClass);
        searchQuery._select = options?.search;
        searchQuery._excludeSelect = options?.excludeSelect;
        searchQuery._relationsJoin = getMetaRelations(SchemaClass).reduce((obj, value) => ({
            ...obj,
            [value]: {
                alias: null,
                select: '*',
            }
        }), {});

        return searchQuery;
    }

    /**
     * Short aliases primary usage is to avoid DB's alias length restriction. It's disabled by default.
     *
     * @param {string} relationPath
     * @example model.firstRelation.secondRelation
     *
     * @param {boolean} isShort
     */
    public static getRelationAlias(relationPath: string, isShort = false) {
        const relationsArray = relationPath.split('.');

        if (!isShort) {
            return relationsArray.join('_');
        } else {
            // first letter + the uppercase letters + relation index in path + relation length
            // model.firstRelation.secondRelation -> m0_fr113_sr214
            return relationsArray.map((relation, index) => {
                // root alias shouldn't change
                if (index === 0) {
                    return relation;
                }

                return relation[0]
                    + relation.split('')
                        .filter(letter => /\w/.test(letter) && letter === letter.toUpperCase())
                        .map(letter => letter.toLowerCase())
                        .join('')
                    + String(index)
                    + relation.length;
            }).join('_');
        }
    }

    select(value: string | string[]) {
        this._select = [].concat(value || []);
        return this;
    }

    addSelect(value: string | string[]) {
        this._select = [
            ...this._select,
            ...[].concat(value || []),
        ];
        return this;
    }

    getSelect() {
        return this._select;
    }

    excludeSelect(value: string | string[]) {
        this._excludeSelect = [].concat(value || []);
        return this;
    }

    getExcludeSelect() {
        return this._excludeSelect;
    }

    alias(value: string) {
        this._alias = value;
        return this;
    }

    getAlias() {
        return this._alias;
    }

    /**
     * Short name for getRelationAlias
     * @param {string} relationPath
     */
    public a(relationPath) {
        return this.getRelationAlias(relationPath);
    }

    public getRelationAlias(relationPath) {
        return SearchQuery.getRelationAlias([this._alias, relationPath].join('.'), this._useShortAliases);
    }

    getShortAliasesAreUsed(): boolean {
        return this._useShortAliases;
    }

    with(relation: Record<string, string | string[]> | string | string[], useJoin = true) {
        if (useJoin) {
            if (!this._relationsJoin) {
                this._relationsJoin = {};
            }
        } else {
            if (!this._relationsNoJoin) {
                this._relationsNoJoin = {};
            }
        }

        const relations = useJoin ? this._relationsJoin : this._relationsNoJoin;

        // Normalize format (one relation, many relations, relations + select)
        let relationObj = {};
        if (typeof relation === 'string') {
            relationObj = {[relation]: '*'};
        } else if (Array.isArray(relation)) {
            relationObj = relation.reduce((obj, value) => ({
                ...obj,
                [value.split(' ')[0]]: {
                    alias: value.split(' ')[1] || null,
                    select: '*',
                },
            }), {});
        } else if (typeof relation === 'object') {
            relationObj = Object.keys(relation).reduce((obj, key) => ({
                ...obj,
                [key.split(' ')[0]]: {
                    alias: key.split(' ')[1] || null,
                    select: relation[key] || '*',
                },
            }), {});
        }

        Object.keys(relationObj).forEach(path => {
            // Store intermediate relations
            // Normalize relations: a.b.c -> a, a.b, a.b.c
            let currentPath;
            path.split('.').forEach(name => {
                currentPath = [currentPath, name].filter(Boolean).join('.');
                if (!relations[currentPath]) {
                    relations[currentPath] = {
                        alias: null,
                        select: '*',
                    };
                }
            });

            if (relationObj[path].alias && relations[path].alias && relationObj[path].alias !== relations[path].alias) {
                console.warn(`[@steroidsjs/nest] There are multiple aliases (${relationObj[path].alias}, ${relations[path].alias}) in SearchQuery. The last one will be used.`);
            }

            relations[path] = {
                ...relations[path],
                ...relationObj[path],
            };
        });

        return this;
    }

    withNoJoin(relation: Record<string, string | string[]> | string | string[]) {
        return this.with(relation, false);
    }

    getWith() {
        return Object.keys(this._relationsJoin || {})
            .map(path => (
                [
                    path,
                    this._relationsJoin[path].alias,
                ]
                    .filter(Boolean)
                    .join(' ')
            ))
            .sort();
    }

    getWithNoJoin() {
        return this._relationsNoJoin;
    }

    where(condition: ICondition) {
        this._condition = condition;
        return this;
    }

    filterWhere(condition: ICondition) {
        return this.where(['filter', condition]);
    }

    andWhere(condition: ICondition) {
        if (this._condition) {
            this._condition = [
                'and',
                this._condition,
                condition,
            ];
            return this;
        } else {
            return this.where(condition);
        }
    }

    andFilterWhere(condition: ICondition) {
        return this.andWhere(['filter', condition]);
    }

    orWhere(condition: ICondition) {
        if (this._condition) {
            this._condition = [
                'or',
                this._condition,
                condition,
            ];
            return this;
        } else {
            return this.where(condition);
        }
    }

    orFilterWhere(condition: ICondition) {
        return this.orWhere(['filter', condition]);
    }

    getWhere() {
        return this._condition;
    }

    /**
     * Converts the input value for orderBy to a single view
     *
     * @param orderValue string or object with keys such as:
     * - `field`
     * - `modelAlias.field`
     * - `modelAlias.relationAlias.field`
     * - `modelAlias_relationAlias.field`
     * - `modelAlias_relationAlias_field`
     *
     * It also works with the same values, but in double quotes for each word separated by a dot
     * (example, `"modelAlias"."field"` or `modelAlias."field"`).
     *
     * @param direction sorting direction
     *
     * @return `ISearchQueryOrder` object, which contains keys such as:
     * - `"modelAlias"."field"`
     * - `"modelAlias_relationAlias"."field"`
     * - `"modelAlias_relationAlias_field"`
     *
     * @protected
     */
    protected normalizeOrderByValue(
        orderValue: string | ISearchQueryOrder,
        direction: 'asc' | 'desc',
    ): ISearchQueryOrder {
        if (typeof orderValue === 'string') {
            const pathToField = orderValue.split('.');
            const field = pathToField.pop();

            if (pathToField[0] === this._alias) {
                pathToField.shift();
            }

            if (!pathToField.length) {
                if (field.split('_')[0] === this._alias) {
                    return {
                        [`${wrapInDoubleQuotes(field)}`]: direction,
                    };
                }
                return {
                    [`${wrapInDoubleQuotes(this._alias)}.${wrapInDoubleQuotes(field)}`]: direction,
                };
            }

            if (pathToField.length === 1 && pathToField[0].split('_')[0] === this._alias) {
                return {
                    [`${wrapInDoubleQuotes(pathToField[0])}.${wrapInDoubleQuotes(field)}`]: direction,
                };
            }

            const relationAlias = this.getRelationAlias(pathToField.join('.'));
            return {
                [`${wrapInDoubleQuotes(relationAlias)}.${wrapInDoubleQuotes(field)}`]: direction,
            };
        }

        return Object.entries(orderValue).reduce((acc, [key, value]) => ({
            ...acc,
            ...this.normalizeOrderByValue(key, value),
        }), {});
    }

    orderBy(value: string | ISearchQueryOrder, direction: 'asc' | 'desc' = 'asc') {
        this._orders = this.normalizeOrderByValue(value, direction);
        return this;
    }

    addOrderBy(value: string | ISearchQueryOrder, direction: 'asc' | 'desc' = 'asc') {
        this._orders = {
            ...this._orders,
            ...this.normalizeOrderByValue(value, direction),
        };
        return this;
    }

    getOrderBy() {
        return this._orders;
    }

    limit(value) {
        this._limit = value;
        return this;
    }

    getLimit() {
        return this._limit;
    }

    offset(value) {
        this._offset = value;
        return this;
    }

    getOffset() {
        return this._offset;
    }

    withDeleted() {
        this._withDeleted = true;
        return this;
    }

    isWithDeleted() {
        return this._withDeleted;
    }

    async one() {
        if (this._onGetOne) {
            return this._onGetOne(this);
        }
        throw new Error('[@steroidsjs/nest] SearchQuery do not support one() method. Provide _onGetOne param in config');
    }

    async many(eagerLoading: boolean = true) {
        if (this._onGetMany) {
            return this._onGetMany(this);
        }
        throw new Error('[@steroidsjs/nest] SearchQuery do not support many() method. Provide _onGetMany param in config');
    }

    async scalar() {
        const row = await this._onGetOne(this);
        const key = _trim(this._select?.[0], '"');
        return row && (row?.[key] || Object.values(row)?.[0]) || null;
    }

    async column() {
        const rows = await this._onGetMany(this);
        return (rows || []).map(row => Object.values(row)?.[0] || null);
    }
}
