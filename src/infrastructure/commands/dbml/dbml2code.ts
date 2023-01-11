import {join} from 'path';
import * as fs from 'fs';
import {
    upperFirst as _upperFirst,
    uniq as _uniq,
    uniqWith as _uniqWith,
    isEqual as _isEqual,
    camelCase as _camelCase,
    split as _split
} from 'lodash';
import * as pluralize from 'pluralize';
import {loadConfiguration} from '@nestjs/cli/lib/utils/load-configuration';
import {CommandUtils} from 'typeorm-steroids/commands/CommandUtils';
import {exporter} from '@dbml/core';
import {templateModel, templateModelField, templateModelRelation, templateTable} from './templates';

const relationsMap = {
    '11': 'OneToOne',
    '1*': 'OneToMany',
    '*1': 'ManyToOne',
    '**': 'ManyToMany',
};

const determineRelation = (dbmlJson, manyToManyTables, endpointId) => {
    const endpointLeft = dbmlJson.endpoints[endpointId];

    const ref = dbmlJson.refs[endpointLeft.refId];
    const endpointRight = dbmlJson.endpoints[
        ref.endpointIds.filter(refEndpointId => refEndpointId !== endpointId)[0]
        ];

    const relationLeft = endpointLeft.relation;
    const relationRight = endpointRight.relation;
    let relationType = relationLeft + relationRight;
    let fieldRight = dbmlJson.fields[endpointRight.fieldIds[0]];

    if (relationType === '1*') {
        const manyToManyTable = manyToManyTables.find(table => table.id === fieldRight.tableId)
        if (manyToManyTable) {
            relationType = '**';
            const manyToManyRelationFieldId = manyToManyTable.fieldIds.filter(
                fieldId => fieldId !== fieldRight.id
            )[0];
            const manyToManyRelationField = dbmlJson.fields[manyToManyRelationFieldId];
            const manyToManyRelationEndpoint = dbmlJson.endpoints[manyToManyRelationField.endpointIds[0]];
            const manyToManyRelationRef = dbmlJson.refs[manyToManyRelationEndpoint.refId];
            const realRelationEndpoint = dbmlJson.endpoints[
                manyToManyRelationRef.endpointIds.filter(endpointId => endpointId !== manyToManyRelationEndpoint.id)[0]
                ];
            fieldRight = dbmlJson.fields[realRelationEndpoint.fieldIds[0]];
        }
    }
    return {
        relationType,
        fieldRight,
    };
}

const findManyToManyTables = (dbmlJson: any) => {
    const manyToManyTables = [];
    Object.values(dbmlJson.tables).forEach((table: any) => {
        if (table.fieldIds.length === 2
            && dbmlJson.fields[table.fieldIds[0]].name.endsWith('Id')
            && dbmlJson.fields[table.fieldIds[1]].name.endsWith('Id')) {
            manyToManyTables.push(table);
        }
    });
    return manyToManyTables;
}

const findModules = (tables: Array<{ name: string }>) => {
    return _uniq(
        tables.map(table => _split(table.name, '_')[0])
    );
}

const getFieldType = (fieldName, typeName, isPrimaryKey) => {
    const typesMap = {
        varchar: 'string',
        int: 'integer',
        integer: 'integer',
        bool: 'boolean',
        boolean: 'boolean',
        date: 'date',
        datetime: 'dateTime',
        double: 'decimal',
        decimal: 'decimal',
        float: 'decimal',
        text: 'text',
    };

    let fieldType = typesMap[typeName] || 'string';
    if (isPrimaryKey) {
        fieldType = 'primaryKey';
    }
    if (['createTime', 'updateTime'].includes(fieldName)) {
        fieldType = fieldName;
    }
    if (fieldName.indexOf('phone') !== -1) {
        fieldType = 'phone';
    }
    if (fieldName.indexOf('email') !== -1) {
        fieldType = 'email';
    }
    if (fieldName.indexOf('password') !== -1) {
        fieldType = 'password';
    }
    return fieldType;
}

const getFieldJsType = (fieldType) => {
    let fieldJsType = 'string';
    if (['integer', 'decimal', 'primaryKey'].includes(fieldType)) {
        fieldJsType = 'number';
    }
    if (fieldType === 'boolean') {
        fieldJsType = 'boolean';
    }
    if (['createTime', 'updateTime'].includes(fieldType)) {
        fieldJsType = 'Date';
    }
    return fieldJsType;
}

const getRelationFieldName = (baseName, relationType, fieldName, relalationTableName) => {
    let relationFieldName = baseName;
    if (relationType.endsWith('Many')) {
        const nameWords = _split(relalationTableName, '_');
        nameWords[nameWords.length - 1] = pluralize.plural(nameWords[nameWords.length - 1]);
        relationFieldName = _camelCase(nameWords.join('_'));
    }
    if (relationType === 'ManyToOne') {
        relationFieldName = fieldName.endsWith('Id') ? fieldName.slice(0, -2) : fieldName.name;
    }
    return relationFieldName;
}

export async function dbml2code(path) {

    if (!fs.existsSync(path)) {
        throw new Error('Not found file: ' + path);
    }

    // Get source root directory
    const cliConfiguration = await loadConfiguration();
    const sourceRoot = join(process.cwd(), cliConfiguration.sourceRoot);

    const dbmlRaw = fs.readFileSync(path, 'utf-8');
    const dbmlJson: any = JSON.parse(exporter.export(dbmlRaw, 'json'));

    //Связи ManyToMany, для которых уже добавлен декоратор JoinTable
    const relationsWithJoin = [];

    const manyToManyTables = findManyToManyTables(dbmlJson);

    const modules = findModules(Object.values(dbmlJson.tables));
    modules.forEach((moduleName: string) => {

        // Create directories
        [
            '',
            'domain',
            'domain/models',
            'infrastructure',
            'infrastructure/tables',
        ].forEach(relativeDir => {
            const dirPath = join(sourceRoot, moduleName, relativeDir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath);
            }
        });

        Object.values(dbmlJson.tables).forEach((table: any) => {
            //Таблица есть в текущем модуле и не является реализацией ManyToMany связи
            if (!table.name.startsWith(moduleName) || manyToManyTables.includes(table)) {
                return;
            }

            const entityName = table.name;
            const modelName = _upperFirst(_camelCase(entityName)) + 'Model';
            const tableName = _upperFirst(_camelCase(entityName)) + 'Table';
            const tableDescription = table.note;
            const importedFields = [];
            const modelFieldCodes = [];
            const importedModels: Array<{ model: string, module: string }> = [];

            table.fieldIds.forEach(fieldId => {
                const fieldName = dbmlJson.fields[fieldId].name;
                const fieldLabel = dbmlJson.fields[fieldId].note || '';

                let isVirtualField = false;
                //Check relations
                if (dbmlJson.fields[fieldId].endpointIds.length > 0) {
                    const fieldLeft = dbmlJson.fields[fieldId];

                    fieldLeft.endpointIds.forEach(endpointId => {
                        let {relationType, fieldRight} = determineRelation(dbmlJson, manyToManyTables, endpointId);
                        relationType = relationsMap[relationType];

                        const rightTable = dbmlJson.tables[fieldRight.tableId];
                        const baseRightName = _camelCase(rightTable.name);
                        const modelRightName = _upperFirst(baseRightName) + 'Model';

                        let fieldName = getRelationFieldName(
                            baseRightName, relationType, fieldLeft.name, rightTable.name
                        );

                        if (relationType === 'ManyToOne') {
                            isVirtualField = true;
                        }

                        let isOwningSide = false;
                        if ((relationType === 'OneToOne' && fieldName !== 'id')
                            || (relationType === 'ManyToMany'
                                && !relationsWithJoin.includes(`${fieldId} - ${fieldRight.id}`))
                        ) {
                            isOwningSide = true;
                            isVirtualField = true;
                            relationsWithJoin.push(`${fieldRight.id} - ${fieldId}`);
                        }

                        importedFields.push('RelationField');
                        if (rightTable.name !== table.name) {
                            const moduleToImport = _split(rightTable.name, '_')[0];
                            importedModels.push({model: modelRightName, module: moduleToImport});
                        }

                        modelFieldCodes.push(templateModelRelation(
                            fieldLabel,
                            relationType,
                            isOwningSide,
                            modelRightName,
                            fieldName,
                        ));
                    });
                }

                if (isVirtualField && !dbmlJson.fields[fieldId].pk) {
                    return;
                }

                // Field type
                const fieldType = getFieldType(
                    fieldName,
                    dbmlJson.fields[fieldId].type.type_name,
                    dbmlJson.fields[fieldId].pk
                );

                // Js type
                const fieldJsType = getFieldJsType(fieldType)

                const decoratorName = _upperFirst(fieldType) + 'Field';
                importedFields.push(decoratorName);
                modelFieldCodes.push(templateModelField(
                    decoratorName,
                    fieldLabel,
                    fieldName,
                    fieldJsType,
                ));
            });


            const modulesImports = _uniqWith(importedModels, _isEqual).reduce((code, importedModel) => {
                let path = '';
                if (importedModel.module === moduleName) {
                    path = `./${importedModel.model}`;
                } else {
                    path = `../../../${importedModel.module}/domain/models/${importedModel.model}`;
                }

                code += `import { ${importedModel.model} } from '${path}';\n`;
                return code;
            }, '');


            const modelCode = templateModel(
                importedFields,
                modulesImports,
                tableDescription,
                modelName,
                modelFieldCodes,
            );

            const modelFilePath = join(sourceRoot, moduleName, `domain/models/${modelName}.ts`);
            if (!fs.existsSync(modelFilePath)) {
                CommandUtils.createFile(modelFilePath, modelCode);
            }

            const tableCode = templateTable(
                modelName,
                entityName,
                tableName,
            );
            const tableFilePath = join(sourceRoot, moduleName, `infrastructure/tables/${tableName}.ts`);
            if (!fs.existsSync(tableFilePath)) {
                CommandUtils.createFile(tableFilePath, tableCode);
            }
        });
    });

}
