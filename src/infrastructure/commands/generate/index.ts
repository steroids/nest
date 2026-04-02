import {loadConfiguration} from '@nestjs/cli/lib/utils/load-configuration';
import {join, resolve} from 'path';
import * as fs from 'fs';
import {CommandUtils} from '@steroidsjs/typeorm/commands/CommandUtils';
import {Connection, DataSource} from '@steroidsjs/typeorm';
import {format} from '@sqltools/formatter';
import * as glob from 'glob';
import {CustomRdbmsSchemaBuilder} from './CustomRdbmsSchemaBuilder';
import {ModuleHelper} from '../../helpers/ModuleHelper';
import {getNewPermissions} from '../../utils/getNewPermissions';

const ADD_PERMISSIONS_NAME = 'AddPermissions';

const queryParams = (parameters: any[] | undefined): string => {
    if (!parameters || !parameters.length) {
        return '';
    }

    return `, ${JSON.stringify(parameters)}`;
};

const prettifyQuery = (query: string) => {
    const formattedQuery = format(query, {indent: '    '});
    query = '\n' + formattedQuery.replace(/^/gm, '            ') + '\n        ';
    query = query.replace(/`/g, '\\`');
    return query;
};

/**
 * Gets contents of the migration file.
 */
const getTemplate = (name: string, timestamp: number, upSqls: string[], downSqls: string[]): string => {
    const migrationName = `${name}${timestamp}`;

    return `import {MigrationInterface, QueryRunner} from '@steroidsjs/typeorm';

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
};

export const generateMigrationsForPermissions = async (dataSource: DataSource, permissionOptions = {
    table: 'auth_permission',
    column: 'name',
    module: 'auth',
}) => {
    const newPermissions = await getNewPermissions(dataSource, permissionOptions.table, permissionOptions.column);

    if (!newPermissions.length) {
        // eslint-disable-next-line no-console
        console.log('info', 'No changes in permissions were found');
        return;
    }

    const cliConfiguration = await loadConfiguration();
    const dirPath = join(process.cwd(), cliConfiguration.sourceRoot, permissionOptions.module, 'infrastructure', 'migrations');

    const values = newPermissions
        .map(key => `('${key}')`)
        .join(',\n            ');

    const upRaw = `INSERT INTO ${permissionOptions.table} (${permissionOptions.column}) VALUES\n    ${values};`;

    const downRaw = `DELETE FROM ${permissionOptions.table} WHERE ${permissionOptions.column} IN (${newPermissions.map(permission => `'${permission}'`).join(', ')});`;

    const upQueries = [
        `        await queryRunner.query(\`${prettifyQuery(upRaw)}\`);`,
    ];

    const downQueries = [
        `        await queryRunner.query(\`${prettifyQuery(downRaw)}\`);`,
    ];

    const timestamp = new Date().getTime();

    const migrationFileContent = getTemplate(
        ADD_PERMISSIONS_NAME,
        timestamp,
        upQueries,
        downQueries,
    );
    const migrationFilePath = join(dirPath, `${timestamp}-${ADD_PERMISSIONS_NAME}.ts`);
    // eslint-disable-next-line no-console
    console.log('info', '\t' + migrationFilePath);
    await CommandUtils.createFile(migrationFilePath, migrationFileContent);
};

export const generate = async (connection: Connection) => {
    const hasPendingMigrations = await connection.showMigrations();

    if (hasPendingMigrations) {
        console.error('[ERROR!] Unapplied migrations detected. Database schema is out of sync.');
        return;
    }

    // Get mapping model name to table name
    const junctionTablesMap = {};

    const classesToTablesMap = connection.entityMetadatas.reduce((obj, entityMeta) => {
        obj[entityMeta.targetName] = entityMeta.tableName;

        entityMeta.manyToManyRelations.forEach(manyToManyRelation => {
            if (manyToManyRelation.joinTableName) {
                junctionTablesMap[manyToManyRelation.joinTableName] = entityMeta.tableName;
            }
        });
        return obj;
    }, {});

    // Get source root directory
    const cliConfiguration = await loadConfiguration();
    const sourceRoot = join(process.cwd(), cliConfiguration.sourceRoot);

    // Each all models, store models info by table names
    const tablesInfo: Record<string, {tableClassName: string, tablePath: string}> = {};
    const moduleDirs = fs.readdirSync(sourceRoot);
    for (const moduleName of moduleDirs) {
        if (fs.statSync(join(sourceRoot, moduleName)).isDirectory()) {
            const moduleDir = join(sourceRoot, moduleName);
            const tableFilesPaths = await Promise.resolve(new Promise((resolve, reject) => {
                glob(moduleDir + '/**/tables/*Table{.ts,.js}', (err, matches) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(matches);
                    }
                });
            }));
            for (const tableFilePath of (tableFilesPaths as any)) {
                const tableClassName = tableFilePath.split('/').at(-1).replace(/\.ts$/, '');
                const tableName = classesToTablesMap[tableClassName];
                tablesInfo[tableName] = {
                    tableClassName,
                    tablePath: tableFilePath,
                };
            }
        }
        const moduleTables = ModuleHelper.getEntities(moduleName);
        for (const moduleTable of moduleTables) {
            const tableClassName = moduleTable.name;
            const tableName = classesToTablesMap[tableClassName];
            tablesInfo[tableName] = {
                tableClassName,
                tablePath: join(sourceRoot, moduleName, 'infrastructure', 'tables', tableClassName + '.ts'),
            };
        }
    }

    // Generate migrations, separated by table names
    const migrationsByTables: Record<string, {upQueries: string[], downQueries: string[]}> = {};
    const sqlInMemory = await (new CustomRdbmsSchemaBuilder(connection)).log();

    for (const item of sqlInMemory.upTableQueries) {
        const tableName = junctionTablesMap[item.tableName] || item.tableName;

        if (!migrationsByTables[tableName]) {
            migrationsByTables[tableName] = {
                upQueries: [],
                downQueries: [],
            };
        }
        migrationsByTables[tableName].upQueries.push(
            '        await queryRunner.query(`' + prettifyQuery(item.query.query) + '`' + queryParams(item.query.parameters) + ');',
        );
    }
    for (const item of sqlInMemory.downTableQueries) {
        const tableName = junctionTablesMap[item.tableName] || item.tableName;
        migrationsByTables[tableName].downQueries.push(
            '        await queryRunner.query(`' + prettifyQuery(item.query.query) + '`' + queryParams(item.query.parameters) + ');',
        );
    }

    // Generate migrations
    const timestamp = new Date().getTime();
    if (Object.keys(migrationsByTables).length === 0) {
        // eslint-disable-next-line no-console
        console.log('info', 'No changes in database schema were found');
    } else {
        // eslint-disable-next-line no-console
        console.log('info', 'Created migrations:');
        for (const tableName in migrationsByTables) {
            if (!tablesInfo[tableName]) {
                console.error('[ERROR!] Not found info for table: ' + tableName);
                continue;
            }
            const tableClassName = tablesInfo[tableName].tableClassName;
            const tablePath = tablesInfo[tableName].tablePath;

            //Создание файла миграции с созданием таблиц, если такие запросы существуют
            const tableDeclarationUpQueries = migrationsByTables[tableName].upQueries.filter(query => query.includes('CREATE TABLE'));
            const tableDeclarationDownQueries = migrationsByTables[tableName].downQueries.filter(query => query.includes('DROP TABLE')).reverse();

            if (tableDeclarationUpQueries.length > 0 || tableDeclarationDownQueries.length > 0) {
                const tableDeclarationFileContent = getTemplate(
                    tableClassName,
                    timestamp,
                    tableDeclarationUpQueries,
                    tableDeclarationDownQueries,
                );
                const tableDeclarationFileName = timestamp + '-' + tableClassName + '.ts';
                const tableDeclarationFilePath = resolve(tablePath, '../../migrations', tableDeclarationFileName);

                // eslint-disable-next-line no-console
                console.log('info', '\t' + tableDeclarationFilePath);
                await CommandUtils.createFile(tableDeclarationFilePath, tableDeclarationFileContent);
            }

            //Создание файла миграции с добавлением в таблицу внешних ключей, если такие запросы существуют
            const nextTimestamp = timestamp + 1;

            const foreignKeysUpQueries = migrationsByTables[tableName].upQueries.filter(query => !query.includes('CREATE TABLE'));
            const foreignKeysDownQueries = migrationsByTables[tableName].downQueries.filter(query => !query.includes('DROP TABLE')).reverse();

            if (foreignKeysUpQueries.length > 0 || foreignKeysDownQueries.length > 0) {
                const foreignKeysFileContent = getTemplate(
                    tableClassName,
                    nextTimestamp,
                    foreignKeysUpQueries,
                    foreignKeysDownQueries,
                );
                const foreignKeysFileName = nextTimestamp + '-' + tableClassName + '.ts';
                const foreignKeysFilePath = resolve(tablePath, '../../migrations', foreignKeysFileName);

                // eslint-disable-next-line no-console
                console.log('info', '\t' + foreignKeysFilePath);
                await CommandUtils.createFile(foreignKeysFilePath, foreignKeysFileContent);
            }
        }
    }
};
