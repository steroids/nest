import {Repository} from 'typeorm';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';
import {getSchemaSelectOptions} from '../../infrastructure/decorators/schema/SchemaSelect';
import {getFieldOptions, getMetaRelations} from '../../infrastructure/decorators/fields/BaseField';
import {ConditionHelper, ICondition} from '../helpers/ConditionHelper';

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
        if (searchQuery.relations) {
            SearchQuery.prepareRelations(
                dbQuery,
                searchQuery.relations,
                prefix,
                dbRepository.target
            );
        }

        // Condition
        if (searchQuery.condition) {
            dbQuery.andWhere(ConditionHelper.toTypeOrm(searchQuery.condition));
        }
    }

    private static prepareRelations(
        dbQuery: SelectQueryBuilder<any>,
        relationsWithAliases: string[],
        rootPrefix: string,
        rootClass: any,
    ) {

        // Normalize relations: a.b.c -> a, a.b, a.b.c
        const relationToAliasMap = {};
        const relations = [];
        relationsWithAliases.forEach(relationWithAlias => {
            // Add root prefix
            relationWithAlias = rootPrefix + '.' + relationWithAlias;

            // Store alias
            const [relation, alias] = relationWithAlias.split(' ');
            relationToAliasMap[relation] = alias || relation.split('.').join('_');
            relations.push(relation);

            // Store intermediate relations
            let path;
            relation.split('.').forEach(name => {
                path = [path, name].filter(Boolean).join('.');
                if (!relationToAliasMap[path]) {
                    relationToAliasMap[path] = path.split('.').join('_');
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
                if (options.appType === 'relation') {
                    classesMap[path] = options.relationClass();
                }

                const property = relationToAliasMap[parentPath] + '.' + relationName;
                const alias = relationToAliasMap[path];
                if (options.relationName) {
                    dbQuery.loadRelationIdAndMap(
                        property,
                        relationToAliasMap[parentPath] + '.' + options.relationName,
                    );
                } else {
                    dbQuery.leftJoinAndSelect(
                        property,
                        alias,
                    );
                }
            });
    }

    with(relation: string | string[]) {
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
