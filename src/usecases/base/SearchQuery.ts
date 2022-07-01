import {trim as _trim} from 'lodash';
import {Repository} from 'typeorm';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';
import {getSchemaSelectOptions} from '../../infrastructure/decorators/schema/SchemaSelect';
import {getFieldOptions, getMetaRelations} from '../../infrastructure/decorators/fields/BaseField';
import {ConditionHelper, ICondition} from '../helpers/ConditionHelper';
import {ICrudRepository} from '../interfaces/ICrudRepository';

export type ISearchQueryOrder = { [key: string]: 'asc' | 'desc' }

export const DEFAULT_ALIAS = 'model';

export default class SearchQuery {
    protected _select?: string[];
    protected _excludeSelect?: string[];
    protected _alias?: string;
    protected _relations?: string[];
    protected _condition?: ICondition;
    protected _orders?: ISearchQueryOrder;
    protected _limit?: number;
    protected _offset?: number;
    protected _repository?: ICrudRepository<any>;
    protected _useShortAliases: boolean;

    constructor(repository = null, useShortAliases = false) {
        this._repository = repository;
        this._useShortAliases = useShortAliases;
        this._alias = DEFAULT_ALIAS;
    }

    static createFromSchema(SchemaClass, useShortAliases = false): SearchQuery {
        const searchQuery = new SearchQuery(null, useShortAliases);

        const options = getSchemaSelectOptions(SchemaClass);
        searchQuery._select = options?.search;
        searchQuery._excludeSelect = options?.excludeSelect;
        searchQuery._relations = getMetaRelations(SchemaClass);

        return searchQuery;
    }

    static prepare(
        dbRepository: Repository<any>,
        dbQuery: SelectQueryBuilder<any>,
        searchQuery: SearchQuery,
        eagerLoading: boolean = true,
    ) {
        let result = {
            hasManyRelations: false,
        };
        const prefix = dbQuery.expressionMap?.mainAlias?.name || '';

        // Get select and relations from search schema
        let select = searchQuery._select;
        if (searchQuery._excludeSelect) {
            select = dbRepository.metadata.columns
                .map(column => column.propertyName)
                .filter(name => !searchQuery._excludeSelect.includes(name));
        }

        if (select) {
            dbQuery.select(select.map(name => `${prefix}.${name}`));
        }

        // Find relations
        if (searchQuery._relations) {
            result = {
                ...result,
                ...SearchQuery.prepareRelations(
                    dbQuery,
                    searchQuery._relations,
                    prefix,
                    dbRepository.target,
                    searchQuery.getShortAliasesAreUsed(),
                    eagerLoading,
                ),
            };
        }

        // Condition
        if (searchQuery._condition) {
            dbQuery.andWhere(ConditionHelper.toTypeOrm(searchQuery._condition));
        }

        // Order
        if (searchQuery._orders) {
            dbQuery.orderBy(
                Object.keys(searchQuery._orders).reduce((obj, key) => {
                    obj[key] = searchQuery._orders[key].toUpperCase();
                    return obj;
                }, {})
            );
        }

        // Limit & offset
        if (searchQuery._limit) {
            dbQuery.limit(searchQuery._limit);
        }
        if (searchQuery._offset) {
            dbQuery.offset(searchQuery._offset);
        }

        return result;
    }

    private static prepareRelations(
        dbQuery: SelectQueryBuilder<any>,
        relationsWithAliases: string[],
        rootPrefix: string,
        rootClass: any,
        useShortAliases: boolean = false,
        eagerLoading: boolean = true,
    ) {
        const result = {
            hasManyRelations: false,
        };

        // Normalize relations: a.b.c -> a, a.b, a.b.c
        const relationToAliasMap = {};
        const relations = [];
        relationsWithAliases.forEach(relationWithAlias => {
            // Add root prefix
            relationWithAlias = rootPrefix + '.' + relationWithAlias;

            // Store alias
            const [relation, alias] = relationWithAlias.split(' ');
            relationToAliasMap[relation] = alias || SearchQuery.getRelationAlias(relation, useShortAliases);
            relations.push(relation);

            // Store intermediate relations
            let path;
            relation.split('.').forEach(name => {
                path = [path, name].filter(Boolean).join('.');
                if (!relationToAliasMap[path]) {
                    relationToAliasMap[path] = SearchQuery.getRelationAlias(path, useShortAliases);
                    if (path !== rootPrefix) {
                        relations.push(path);
                    }
                }
            });
        });

        const classesMap = {
            [rootPrefix]: rootClass,
        };
        relations
            .sort()
            .forEach(path => {
                // Separate: aaa.bbb.ccc -> aaa.bbb + ccc
                const parentPath = path.split('.').slice(0, -1).join('.');
                const relationName = path.split('.').slice(-1).join('.');

                const options = getFieldOptions(classesMap[parentPath], relationName);
                if (options) {
                    if (options.appType === 'relation') {
                        classesMap[path] = options.relationClass();
                    }

                    const property = relationToAliasMap[parentPath] + '.' + relationName;
                    const alias = relationToAliasMap[path];

                    if (options.isArray) {
                        result.hasManyRelations = true;
                    }

                    if (options.relationName) {
                        dbQuery.loadRelationIdAndMap(
                            property,
                            relationToAliasMap[parentPath] + '.' + options.relationName,
                        );
                    } else {
                        if (eagerLoading) {
                            dbQuery.leftJoinAndSelect(
                                property,
                                alias,
                            );
                        } else {
                            dbQuery.leftJoin(property, alias);
                        }
                    }
                }
            });

        return result;
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
                console.warn(`[@steroidsjs/nest] There are multiple aliases (${name}, ${existingRelation}) in SearchQuery for ${this._repository?.constructor?.name}. The last one will be used.`);
            }
        });
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

    _getRepository() {
        if (!this._repository) {
            throw new Error('Not found repository, you need create instance as "new SearchQuery(repository)"');
        }
        return this._repository;
    }

    async one() {
        return this._getRepository().findOne(this);
    }

    async many() {
        return this._getRepository().findMany(this);
    }

    async scalar() {
        const row = await this._getRepository().findOne(this);
        const key = _trim(this._select?.[0], '"');
        return row && (row?.[key] || Object.values(row)?.[0]) || null;
    }

    async column() {
        const rows = await this._getRepository().findMany(this);
        return (rows || []).map(row => Object.values(row)?.[0] || null);
    }
}
