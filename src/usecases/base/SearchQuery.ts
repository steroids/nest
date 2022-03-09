import {Repository} from 'typeorm';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';
import {IRelationFieldOptions} from '../../infrastructure/decorators/fields/RelationField';
import {getSchemaSelectOptions} from '../../infrastructure/decorators/schema/SchemaSelect';
import {getFieldOptions, getMetaRelations} from '../../infrastructure/decorators/fields/BaseField';
import {DataMapper} from '../helpers/DataMapper';
import {ConditionHelper, ICondition} from '../helpers/ConditionHelper';
import {IRelationIdFieldOptions} from '../../infrastructure/decorators/fields/RelationIdField';

export interface IQueryRelation {
    name: string,
    alias?: string,
    isId?: boolean,
}

export default class SearchQuery {
    alias?: string;
    select?: string[];
    excludeSelect?: string[];
    relations?: string[];
    condition?: ICondition;

    static createFromSchema(SchemaClass) {
        const searchQuery = new SearchQuery();

        const options = getSchemaSelectOptions(SchemaClass);
        searchQuery.select = options?.search;
        searchQuery.excludeSelect = options?.excludeSelect;
        searchQuery.relations = getMetaRelations(SchemaClass);

        return searchQuery;
    }

    static prepare(
        dbRepository: Repository<any>,
        dbQuery: SelectQueryBuilder<any>,
        searchQuery: SearchQuery,
    ) {
        const prefix = dbQuery.expressionMap?.mainAlias ? dbQuery.expressionMap.mainAlias.name + '.' : '';
        const relationPrefix = dbQuery.expressionMap?.mainAlias ? dbQuery.expressionMap.mainAlias.name + '_' : 'relation';
        const table = dbRepository.target;

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
            const options = getFieldOptions(table, relation);

            // TODO нужно рекурсивно (через точку в названии relation) брать fieldOptions
            // if (!options) {
            //     throw new Error('Not found relation "' + relation + '" for table "' + table + '"');
            // }

            // TODO убрать null-safe
            switch (options?.appType) {
                case 'relationId':
                    const relationIdOptions = options as IRelationIdFieldOptions;
                    dbQuery.loadRelationIdAndMap(
                        prefix + relation,
                        prefix + relationIdOptions.relationName,
                    );
                    break;

                default:
                case 'relation':
                    let currentPrefix = prefix;
                    let childRelation = null;
                    // TODO nested selects

                    // TODO Код рабочий только до 1-го уровня вложенности
                    // find parent relation name
                    const parentRelation = /\./.test(relation)
                        ? relation.replace(/\.\w+/, '')
                        : null;

                    if (parentRelation) {
                        // current relations name is combined from all parents prefixes + current relation name
                        currentPrefix = relationPrefix + parentRelation;
                        childRelation = relation.replace(parentRelation, '');
                    }

                    dbQuery.leftJoinAndSelect(
                        currentPrefix + (childRelation || relation),
                        relationPrefix + relation
                    );
                    break;
            }
        });

        // Condition
        if (searchQuery.condition) {
            dbQuery.andWhere(ConditionHelper.toTypeOrm(searchQuery.condition));
        }
    }
}
