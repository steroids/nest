import {MetaHelper} from '../../infrastructure/helpers/MetaHelper';
import {ConditionHelper, ICondition} from '../../infrastructure/helpers/ConditionHelper';
import {Repository} from 'typeorm';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';

export interface IQueryRelation {
    name: string,
    alias?: string,
    isId?: boolean,
}

export default class SearchQuery {
    select?: string[];
    excludeSelect?: string[];
    relations?: IQueryRelation[];
    condition?: ICondition;

    static createFromSchema(SchemaClass) {
        return new SearchQuery(MetaHelper.getSchemaQueryData(SchemaClass));
    }

    static prepare(
        dbRepository: Repository<any>,
        dbQuery: SelectQueryBuilder<any>,
        searchQuery: SearchQuery,
    ) {

        const prefix = dbQuery.expressionMap.mainAlias.name + '.';

        // Get select and relations from search schema
        let select = searchQuery.select;
        if (searchQuery.excludeSelect) {
            select = dbRepository.metadata.columns
                .map(column => column.propertyName)
                .filter(name => !searchQuery.excludeSelect.includes(name));
        }

        if (select) {
            // TODO nested selects
            dbQuery.select(select.map(name => prefix + name));
        }

        // Find relations
        (searchQuery.relations || []).forEach(relation => {
            if (relation.isId) {
                dbQuery.loadRelationIdAndMap(
                    prefix + (relation.alias || relation.name),
                    prefix + relation.name,
                );
            } else {
                dbQuery.relation(relation.name);
            }
        });

        // Condition
        if (searchQuery.condition) {
            dbQuery.andWhere(ConditionHelper.toTypeOrm(searchQuery.condition));
        }
    }

    constructor(data: SearchQuery = {}) {
        this.select = data.select;
        this.excludeSelect = data.excludeSelect;
        this.relations = data.relations;
        this.condition = data.condition;
    }
}
