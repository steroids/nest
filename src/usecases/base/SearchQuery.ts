import {Repository} from 'typeorm';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';
import {getSchemaSelectOptions} from '../../infrastructure/decorators/schema/SchemaSelect';
import {getFieldOptions, getMetaRelations} from '../../infrastructure/decorators/fields/BaseField';
import {ConditionHelper, ICondition} from '../helpers/ConditionHelper';
import {IRelationIdFieldOptions} from '../../infrastructure/decorators/fields/RelationIdField';

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
        const prefix = dbQuery.expressionMap?.mainAlias?.name || '';

        // Get select and relations from search schema
        let select = searchQuery.select;
        if (searchQuery.excludeSelect) {
            select = dbRepository.metadata.columns
                .map(column => column.propertyName)
                .filter(name => !searchQuery.excludeSelect.includes(name));
        }

        if (select) {
            dbQuery.select(select.map(name => `${prefix}.${name}`));
        }

        // Find relations
        searchQuery.relations && SearchQuery.prepareRelations(
            dbQuery,
            searchQuery.relations,
            prefix,
            dbRepository.target
        );

        // Condition
        if (searchQuery.condition) {
            dbQuery.andWhere(ConditionHelper.toTypeOrm(searchQuery.condition));
        }
    }

    private static prepareRelations(
        dbQuery: SelectQueryBuilder<any>,
        relations: string[],
        parentPrefix: string,
        parentTable: any
    ) {
        relations.forEach(relation => {
            let fieldOptions;

            const relationFullPath = [...parentPrefix.split('.'), ...relation.split('.')];
            const relationRelativePath = relation.replace(parentPrefix, '').split('.');

            const currentRelationField = relationRelativePath[0];

            // nested relation case
            if (relationRelativePath.length > 1) {
                fieldOptions = getFieldOptions(parentTable, currentRelationField);

                relationRelativePath.splice(0, 1);

                const childRelationRelativePath = relationRelativePath.join('.');

                SearchQuery.prepareRelations(
                    dbQuery,
                    [childRelationRelativePath],
                    `${parentPrefix}.${currentRelationField}`,
                    fieldOptions.relationClass()
                );
            } else {
                fieldOptions = getFieldOptions(parentTable, currentRelationField) as IRelationIdFieldOptions;

                if (!fieldOptions) {
                    throw new Error('Not found meta data for relation "' + currentRelationField
                        + '" for table "' + parentTable + '"');
                }

                // remove last item from path
                relationFullPath.pop();
                const parentAlias = relationFullPath.join('_');

                switch (fieldOptions.appType) {
                    case 'relationId':
                        dbQuery.loadRelationIdAndMap(
                            `${parentAlias}.${currentRelationField}`,
                            `${parentAlias}.${fieldOptions.relationName}`
                        );
                        break;

                    case 'relation':
                        dbQuery.leftJoinAndSelect(
                            `${parentAlias}.${currentRelationField}`,
                            `${parentAlias}_${currentRelationField}`
                        );
                        break;
                }
            }
        })
    }

    with(relation: string|string[]) {
        if (!this.relations) {
            this.relations = [];
        }
        [].concat(relation || []).forEach(name => {
            if (!this.relations.includes(name)) {
                this.relations.push(name);
            }
        });
        return this;
    }

    where(condition: ICondition) {
        this.condition = condition;
        return this;
    }

    filterWhere(condition: ICondition) {
        return this.where(['filter', condition]);
    }

    andWhere(condition: ICondition) {
        if (this.condition) {
            this.condition = [
                'and',
                this.condition,
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
        if (this.condition) {
            this.condition = [
                'or',
                this.condition,
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
}
