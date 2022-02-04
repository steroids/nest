import {Command, Positional} from 'nestjs-command';
import {Injectable} from '@nestjs/common';
import {Connection} from 'typeorm';
import * as lodash from 'lodash';
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
import {format} from '@sqltools/formatter/lib/sqlFormatter';
import {ConfigService} from '@nestjs/config';
import {loadConfiguration} from '@nestjs/cli/lib/utils/load-configuration';
import {CommandUtils} from 'typeorm/commands/CommandUtils';
import {exporter} from '@dbml/core';

interface IMigrationData {
    moduleDir: string,
    modelName: string,
    tableName: string,
    upQueries: string[],
    downQueries: string[]
}

@Injectable()
export class MigrateCommand {
    constructor(
        private configService: ConfigService,
        private connection: Connection,
    ) {
    }

    @Command({
        command: 'migrate',
        describe: 'Run migrations',
    })
    async index() {
        await this.connection.runMigrations({
            transaction: 'each',
        });
    }

    @Command({
        command: 'migrate:revert',
        describe: 'Revert last migration',
    })
    async redo() {
        await this.connection.undoLastMigration({
            transaction: 'each',
        });
    }

    @Command({
        command: 'migrate:show',
        describe: 'Show migrations list',
    })
    async show() {
        await this.connection.showMigrations();
    }


    determineRelation(dbmlJson, manyToManyTables, endpointId) {
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

    findManyToManyTables(dbmlJson: any) {
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

    findModules(tables: Array<{name: string}>) {
        return _uniq(
            tables.map(table => _split(table.name, '_')[0])
        );
    }

    @Command({
        command: 'migrate:dbml2code <path>',
        describe: 'Generate code from dbml diagram',
    })
    async dbml2code(
        @Positional({
            name: 'path',
            // @ts-ignore
            describe: 'Path to *.dbml file',
            type: 'string'
        })
            path: string,
    ) {
        if (!fs.existsSync(path)) {
            throw new Error('Not found file: ' + path);
        }

        // Get source root directory
        const cliConfiguration = await loadConfiguration();
        const sourceRoot = join(process.cwd(), cliConfiguration.sourceRoot);

        const dbmlRaw = fs.readFileSync(path, 'utf-8');
        const dbmlJson: any = JSON.parse(exporter.export(dbmlRaw, 'json'));

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

        const relationsMap = {
            '11': 'OneToOne',
            '1*': 'OneToMany',
            '*1': 'ManyToOne',
            '**': 'ManyToMany',
        };

        //Связи ManyToMany, для которых уже добавлен декоратор JoinTable
        const relationsWithJoin = [];

        const manyToManyTables = this.findManyToManyTables(dbmlJson);

        const modules = this.findModules(Object.values(dbmlJson.tables));
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
                const importedModels: Array<{model: string, module: string}> = [];

                const fields = table.fieldIds.map(fieldId => {
                    const fieldName = dbmlJson.fields[fieldId].name;
                    const fieldLabel = dbmlJson.fields[fieldId].note || '';

                    let isVirtualField = false;
                    //Check relations
                    if (dbmlJson.fields[fieldId].endpointIds.length > 0) {
                        const fieldLeft = dbmlJson.fields[fieldId];

                        fieldLeft.endpointIds.forEach(endpointId => {
                            let {relationType, fieldRight} = this.determineRelation(dbmlJson, manyToManyTables, endpointId);
                            relationType = relationsMap[relationType];

                            const rightTable = dbmlJson.tables[fieldRight.tableId];
                            const baseRightName = _camelCase(rightTable.name);
                            const modelRightName = _upperFirst(baseRightName) + 'Model';

                            let fieldName = baseRightName;
                            if (relationType.endsWith('Many')) {
                                const nameWords = _split(rightTable.name, '_');
                                nameWords[nameWords.length - 1] = pluralize.plural(nameWords[nameWords.length - 1]);
                                fieldName = _camelCase(nameWords.join('_'));
                            }
                            if (relationType === 'ManyToOne') {
                                fieldName = fieldLeft.name.endsWith('Id') ? fieldLeft.name.slice(0, -2) : fieldLeft.name;
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
                            const moduleToImport = _split(rightTable.name, '_')[0];
                            importedModels.push({model: modelRightName, module: moduleToImport});

                            modelFieldCodes.push(
`    @RelationField({
        label: '${fieldLabel}',
        type: '${relationType}',
        isOwningSide: ${isOwningSide},
        modelClass: () => ${modelRightName},
    })
    ${fieldName}: ${modelRightName}${relationType.endsWith('Many') ? '[]' : '' };`);
                        });
                    }

                    if (isVirtualField && !dbmlJson.fields[fieldId].pk) {
                        return;
                    }

                    // Field type
                    let fieldType = typesMap[dbmlJson.fields[fieldId].type.type_name] || 'string';
                    if (dbmlJson.fields[fieldId].pk) {
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


                    // Js type
                    let fieldJsType = 'string';
                    if (['integer', 'decimal'].includes(fieldType)) {
                        fieldJsType = 'number';
                    }
                    if (fieldType === 'boolean') {
                        fieldJsType = 'boolean';
                    }
                    if (['createTime', 'updateTime'].includes(fieldType)) {
                        fieldJsType = 'Date';
                    }

                    const decoratorName = _upperFirst(fieldType) + 'Field';
                    importedFields.push(decoratorName);
                    modelFieldCodes.push(
`    @${decoratorName}({
        label: '${fieldLabel}',
    })
    ${fieldName}: ${fieldJsType};`);
                });


                const modulesImports = _uniqWith(importedModels, _isEqual).reduce((code, importedModel) => {
                    let path = '';
                    if (importedModel.module === moduleName) {
                        path = `./${importedModel.model}`;
                    } else {
                        path = `../../../${importedModel.module}/domain/models/${importedModel.model}`;
                    }

                    code += `import { ${importedModel.model} } from '${path}';\n`
                    return code;
                }, '');


                const code =
`import {
${_uniq(importedFields).map(line => '    ' + line).join(',\n')},
} from '@steroidsjs/nest/infrastructure/decorators/fields';
${modulesImports}
/**
 * ${tableDescription}
 */
export class ${modelName} {
${modelFieldCodes.join('\n\n')}
}
`;

                console.log(1212, code);

                const filePath = join(sourceRoot, moduleName, `domain/models/${modelName}.ts`);
                if (!fs.existsSync(filePath)) {
                    CommandUtils.createFile(filePath, code);
                }

            });
        });


        //
        // const babelParser = require('@babel/parser');
        // const babelGenerator = require('@babel/generator').default;
        //
        // const code = fs.readFileSync('/Users/kozhin/projects/steroids-dev/steroids/nest/src/infrastructure/commands/BlankModel.ts', 'utf8');
        //
        // const ast = babelParser.parse(code, {
        //     sourceType: 'module',
        //     plugins: ['typescript', 'decorators-legacy'],
        // });
        //
        //console.log(dbmlJson);


    }

    @Command({
        command: 'migrate:generate',
        describe: 'Create migrations for each model changes',
    })
    async generate() {
        // Get mapping model name to table name
        const modelsToTablesMap = this.connection.entityMetadatas.reduce((obj, entityMeta) => {
            obj[entityMeta.targetName] = entityMeta.tableName;
            return obj;
        });

        // Get source root directory
        const cliConfiguration = await loadConfiguration();
        const sourceRoot = join(process.cwd(), cliConfiguration.sourceRoot);

        // Each all models
        const migrationsDataList: IMigrationData[] = [];
        const moduleDirs = fs.readdirSync(sourceRoot);
        for (const moduleName of moduleDirs) {
            if (fs.statSync(join(sourceRoot, moduleName)).isDirectory()) {
                const moduleDir = join(sourceRoot, moduleName);
                const moduleClassPath = join(moduleDir, '/infrastructure/' + lodash.upperFirst(moduleName) + 'Module.ts');

                if (fs.existsSync(moduleClassPath)) {
                    const modelsDir = join(sourceRoot, moduleName, 'infrastructure/tables');
                    const modelFiles = fs.readdirSync(modelsDir);

                    const modelPaths = [];
                    for (const modelFile of modelFiles) {
                        modelPaths.push(join(modelsDir, modelFile));
                    }

                    for (const modelFile of modelFiles) {
                        const modelName = modelFile.replace(/\.ts$/, '');

                        const result = await this.generateMigrations(
                            moduleDir,
                            modelPaths,
                            modelName,
                            modelsToTablesMap[modelName],
                        );
                        if (result) {
                            migrationsDataList.push(result);
                        }
                    }
                }
            }
        }

        // Generate migrations
        const timestamp = new Date().getTime();
        if (migrationsDataList.length === 0) {
            // eslint-disable-next-line no-console
            console.log('info', 'No changes in database schema were found');
        } else {
            // eslint-disable-next-line no-console
            console.log('info', 'Created migrations:');
            for (const migrationsData of migrationsDataList) {
                const fileContent = MigrateCommand.getTemplate(
                    migrationsData.modelName,
                    timestamp,
                    migrationsData.upQueries,
                    migrationsData.downQueries.reverse(),
                );
                const fileName = timestamp + '-' + migrationsData.modelName + '.ts';
                const path = join(migrationsData.moduleDir, '/infrastructure/migrations', fileName);

                // eslint-disable-next-line no-console
                console.log('info', '\t' + path);
                await CommandUtils.createFile(path, fileContent);
            }
        }
    }

    protected async generateMigrations(moduleDir, modelPaths, modelName, tableName): Promise<IMigrationData> {
        const connection = new Connection({
            ...this.configService.get('database'),
            entities: modelPaths,
            synchronize: false,
            migrationsRun: false,
            dropSchema: false,
        });
        await connection.connect();

        const migrationData: IMigrationData = {
            modelName,
            moduleDir,
            tableName,
            upQueries: [],
            downQueries: [],
        };
        try {
            const sqlInMemory = await connection.driver.createSchemaBuilder().log();

            for (const key of ['upQueries', 'downQueries']) {
                for (const query of sqlInMemory[key]) {
                    query.query = MigrateCommand.prettifyQuery(query.query);
                    query.query = query.query.replace(/`/g, '\\`');

                    const params = MigrateCommand.queryParams(query.parameters);
                    migrationData[key].push('        await queryRunner.query(`' + query.query + '`' + params + ');');
                }
            }
        } finally {
            await connection.close();
        }

        if (migrationData.upQueries.length === 0) {
            return null;
        }

        return migrationData;
    }

    protected static queryParams(parameters: any[] | undefined): string {
        if (!parameters || !parameters.length) {
            return '';
        }

        return `, ${JSON.stringify(parameters)}`;
    }

    protected static prettifyQuery(query: string) {
        const formattedQuery = format(query, {indent: '    '});
        return '\n' + formattedQuery.replace(/^/gm, '            ') + '\n        ';
    }

    /**
     * Gets contents of the migration file.
     */
    protected static getTemplate(name: string, timestamp: number, upSqls: string[], downSqls: string[]): string {
        const migrationName = `${name}${timestamp}`;

        return `import {MigrationInterface, QueryRunner} from 'typeorm';

export class ${migrationName} implements MigrationInterface {
    name = '${migrationName}'

    public async up(queryRunner: QueryRunner): Promise<void> {
${upSqls.join(`
`)}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${downSqls.join(`
`)}
    }

}
`;
    }
}
