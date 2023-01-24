import {keyBy as _keyBy} from 'lodash';
import {Repository} from '@steroidsjs/typeorm';
import {SelectQueryBuilder} from '@steroidsjs/typeorm/query-builder/SelectQueryBuilder';
import {ConditionHelperTypeORM} from '../helpers/typeORM/ConditionHelperTypeORM';
import {
    getFieldOptions,
    getMetaFields,
    getMetaPrimaryKey,
} from '../decorators/fields/BaseField';
import SearchQuery from '../../usecases/base/SearchQuery';
import {DataMapper} from '../../usecases/helpers/DataMapper';
import {getTableFromModel} from '../decorators/TableFromModel';
import {getMetaRelationIdFieldKey} from '../decorators/fields/RelationField';

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

    static async loadRelationsWithoutJoin(
        MetaClass,
        dbRepository: Repository<any>,
        records,
        relations: Record<string, {
            alias: string,
            select: string | string[],
        }>
    ) {
        const rootPrimaryKey = getMetaPrimaryKey(MetaClass);

        const relationPaths = Object.keys(relations || {}).sort();
        for (let path of relationPaths) {
            const pathItems = path.split('.');
            if (pathItems.length === 1) {
                const relationName = pathItems.shift();

                // Create query
                const searchQuery = new SearchQuery();

                // Add select for query from relations config
                if (Array.isArray(relations[path].select)) {
                    searchQuery.select(relations[path].select);
                }

                // Sub relations
                const subRelationNames = relationPaths
                    .filter(value => value.startsWith(relationName + '.'))
                    .reduce((obj, value) => {
                        const subPath = value.substring(relationName.length + 1);
                        const subAlias = relations[value].alias;
                        const key = [subPath, subAlias].filter(Boolean).join(' ');
                        obj[key] = relations[value].select;

                        return obj;
                    }, {});
                if (Object.keys(subRelationNames).length > 0) {
                    searchQuery.withNoJoin(subRelationNames);
                }

                const options = getFieldOptions(MetaClass, relationName);
                const relationClass = options.relationClass();
                const dbQuery = dbRepository.manager
                    .getRepository(getTableFromModel(relationClass))
                    .createQueryBuilder(searchQuery.getAlias());

                // Execute
                switch (options.type) {
                    case 'OneToMany': // user.images
                        const relationClassOptions = getMetaFields(relationClass);

                        // Find inverse field name
                        const inverseFieldNamesObject = relationClassOptions
                            .reduce((obj, fieldName) => ({
                                ...obj,
                                [fieldName]: fieldName,
                            }), {});
                        const inverseFieldName = typeof options.inverseSide === 'string'
                            ? inverseFieldNamesObject[options.inverseSide]
                            : options.inverseSide(inverseFieldNamesObject);
                        if (!inverseFieldName) {
                            throw new Error('Not found inverse field name for relation: ' + relationName);
                        }

                        const inverseIdFieldName = getMetaRelationIdFieldKey(relationClass, inverseFieldName);
                        if (!inverseIdFieldName) {
                            throw new Error('Not found id field for relation: ' + relationName);
                        }

                        // Where
                        const rootIds = records.map(record => record[rootPrimaryKey]).filter(Boolean);
                        searchQuery.where(['in', inverseIdFieldName, rootIds]);

                        // Execute
                        QueryAdapterTypeORM.prepare(dbRepository, dbQuery, searchQuery, true);
                        const rows = await dbQuery.getMany();
                        let models = rows.map(row => DataMapper.create(relationClass, row));
                        models = await QueryAdapterTypeORM.loadRelationsWithoutJoin(
                            relationClass,
                            dbRepository,
                            models,
                            searchQuery.getWithNoJoin(),
                        );

                        // Populate
                        records = records.map(record => {
                            record[relationName] = models.filter(model => model[inverseIdFieldName] === record[rootPrimaryKey]);
                            return record;
                        });
                        break;

                    case 'ManyToOne': // user.image
                        // Find field with id
                        const idField = getMetaRelationIdFieldKey(MetaClass, relationName);
                        if (!idField) {
                            throw new Error('Not found id field for relation: ' + relationName);
                        }

                        const relationIds = records.map(record => record[idField]).filter(Boolean);
                        if (relationIds.length > 0) {
                            // Where
                            const subRelationPrimaryKey = getMetaPrimaryKey(relationClass);
                            searchQuery.where(['in', subRelationPrimaryKey, relationIds]);

                            // Execute
                            QueryAdapterTypeORM.prepare(dbRepository, dbQuery, searchQuery, true);
                            const rows = await dbQuery.getMany();
                            let models = rows.map(row => DataMapper.create(relationClass, row));
                            models = await QueryAdapterTypeORM.loadRelationsWithoutJoin(
                                relationClass,
                                dbRepository,
                                models,
                                searchQuery.getWithNoJoin(),
                            );

                            // Populate
                            const indexedModels = _keyBy(models, subRelationPrimaryKey);
                            records = records.map(record => {
                                record[relationName] = indexedModels[record[idField]] || null;
                                return record;
                            });
                        }
                        break;

                    default:
                        // TODO Implement ManyMany relation type
                        throw new Error('This relation type is not implement for load relations without join, relation: ' + relationName);

                }
            }
        }

        return records;
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
