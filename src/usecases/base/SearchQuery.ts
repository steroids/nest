import {trim as _trim} from 'lodash';
import {getSchemaSelectOptions} from '../../infrastructure/decorators/schema/SchemaSelect';
import {getMetaRelations} from '../../infrastructure/decorators/fields/BaseField';
import {ICondition} from '../../infrastructure/helpers/typeORM/ConditionHelperTypeORM';

export type ISearchQueryOrder = { [key: string]: 'asc' | 'desc' }

export const DEFAULT_ALIAS = 'model';

export interface ISearchQueryConfig<TModel>{
    useShortAliases?: boolean,
    onGetOne?: (searchQuery: SearchQuery<TModel>) => Promise<TModel>,
    onGetMany?: (searchQuery: SearchQuery<TModel>) => Promise<Array<TModel>>,
}

export default class SearchQuery<TModel>{
    protected _select?: string[];
    protected _excludeSelect?: string[];
    protected _alias?: string;
    protected _relations?: string[];
    protected _condition?: ICondition;
    protected _orders?: ISearchQueryOrder;
    protected _limit?: number;
    protected _offset?: number;
    protected _useShortAliases: boolean;
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
        searchQuery._relations = getMetaRelations(SchemaClass);

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

    with(relation: string | string[]) {
        if (!this._relations) {
            this._relations = [];
        }
        [].concat(relation || []).forEach(name => {
            const existingRelationIndex = this._relations.findIndex(_relation => (
                _relation.split(' ')[0] === name.split(' ')[0]
            ));

            if (existingRelationIndex === -1) {
                this._relations.push(name);
                return;
            }
            const existingRelation = this._relations[existingRelationIndex];

            const existingRelationAlias = existingRelation.split(' ')[1];
            const newRelationAlias = name.split(' ')[1];
            if (newRelationAlias) {
                this._relations[existingRelationIndex] = name;
            }
            if (newRelationAlias && existingRelationAlias) {
                console.warn(`[@steroidsjs/nest] There are multiple aliases (${name}, ${existingRelation}) in SearchQuery. The last one will be used.`);
            }
        });
        this._relations.sort();
        return this;
    }

    getWith() {
        return this._relations;
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

    orderBy(value: string | ISearchQueryOrder, direction: 'asc' | 'desc' = 'asc') {
        this._orders = typeof value === 'string' ? {[value]: direction} : value;
        return this;
    }

    addOrderBy(value: string | ISearchQueryOrder, direction: 'asc' | 'desc' = 'asc') {
        this._orders = {
            ...this._orders,
            ...(typeof value === 'string' ? {[value]: direction} : value),
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
