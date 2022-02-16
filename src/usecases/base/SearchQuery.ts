import {Repository} from 'typeorm';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';
import {IRelationFieldOptions} from '../../infrastructure/decorators/fields/RelationField';
import {getSchemaSelectOptions} from '../../infrastructure/decorators/schema/SchemaSelect';
import {getFieldOptions} from '../../infrastructure/decorators/fields/BaseField';
import {DataMapperHelper} from '../helpers/DataMapperHelper';
import {ConditionHelper, ICondition} from '../helpers/ConditionHelper';
import {IRelationIdFieldOptions} from '../../infrastructure/decorators/fields/RelationIdField';

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
        const searchQuery = new SearchQuery();

        Object.assign(searchQuery, getSchemaSelectOptions(SchemaClass))

        const relations: IQueryRelation[] = [];
        (DataMapperHelper.getKeys(SchemaClass) || []).forEach(fieldName => {
            const modelMeta = getFieldOptions(SchemaClass, fieldName) as IRelationFieldOptions;
            switch (modelMeta.appType) {
                case 'relationId':
                    const relationIdOptions = modelMeta as IRelationIdFieldOptions;
                    relations.push({
                        isId: true,
                        name: relationIdOptions.relationName,
                        alias: fieldName,
                    });
                    break;

                case 'relation':
                    relations.push({
                        name: fieldName,
                        alias: fieldName,
                    });
                    break;
            }
        });
        if (relations.length > 0) {
            searchQuery.relations = relations;
        }

        return searchQuery;
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
                dbQuery.leftJoinAndSelect(prefix + relation.name, prefix + relation.name);
                // TODO nested selects
            }
        });

        // Condition
        if (searchQuery.condition) {
            dbQuery.andWhere(ConditionHelper.toTypeOrm(searchQuery.condition));
        }
    }
}
