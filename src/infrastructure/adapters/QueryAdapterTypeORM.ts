import {Repository} from '@steroidsjs/typeorm';
import {SelectQueryBuilder} from '@steroidsjs/typeorm/query-builder/SelectQueryBuilder';
import {ConditionHelperTypeORM} from '../helpers/typeORM/ConditionHelperTypeORM';
import {getFieldOptions} from '../decorators/fields/BaseField';
import SearchQuery from '../../usecases/base/SearchQuery';

export class QueryAdapterTypeORM {
    static prepare(
        dbRepository: Repository<any>,
        dbQuery: SelectQueryBuilder<any>,
        searchQuery: SearchQuery<any>,
        eagerLoading: boolean = true,
    ) {
        const prefix = dbQuery.expressionMap?.mainAlias?.name || '';

        // Get select and relations from search schema
        let select = searchQuery.getSelect();
        if (searchQuery.getExcludeSelect()) {
            select = dbRepository.metadata.columns
                .map(column => column.propertyName)
                .filter(name => !searchQuery.getExcludeSelect().includes(name));
        }

        if (select) {
            dbQuery.select(select.map(name => `${prefix}.${name}`));
        }

        // Find relations
        if (searchQuery.getWith()) {
            this.prepareRelations(
                dbQuery,
                searchQuery.getWith(),
                prefix,
                dbRepository.target,
                searchQuery.getShortAliasesAreUsed(),
                eagerLoading,
            );
        }

        // Condition
        if (searchQuery.getWhere()) {
            dbQuery.andWhere(ConditionHelperTypeORM.toTypeOrm(
                searchQuery.getWhere(),
                dbQuery,
                dbRepository.target,
            ));
        }

        // Order
        if (searchQuery.getOrderBy()) {
            dbQuery.orderBy(
                Object.keys(searchQuery.getOrderBy()).reduce((obj, key) => {
                    obj[key] = searchQuery.getOrderBy()[key].toUpperCase();
                    return obj;
                }, {})
            );
        }

        // Limit & offset
        if (searchQuery.getLimit()) {
            dbQuery.limit(searchQuery.getLimit());
        }
        if (searchQuery.getOffset()) {
            dbQuery.offset(searchQuery.getOffset());
        }
    }

    private static prepareRelations(
        dbQuery: SelectQueryBuilder<any>,
        relationsWithAliases: string[],
        rootPrefix: string,
        rootClass: any,
        useShortAliases: boolean = false,
        eagerLoading: boolean = true,
    ) {

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
    }
}
