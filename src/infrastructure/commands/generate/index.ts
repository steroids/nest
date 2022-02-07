import {loadConfiguration} from '@nestjs/cli/lib/utils/load-configuration';
import {join} from 'path';
import * as lodash from 'lodash';
import * as fs from 'fs';
import {CommandUtils} from 'typeorm/commands/CommandUtils';
import {Connection} from 'typeorm';
import {format} from '@sqltools/formatter';
import {CustomRdbmsSchemaBuilder} from './CustomRdbmsSchemaBuilder';

const queryParams = (parameters: any[] | undefined): string => {
    if (!parameters || !parameters.length) {
        return '';
    }

    return `, ${JSON.stringify(parameters)}`;
}

const prettifyQuery = (query: string) => {
    const formattedQuery = format(query, {indent: '    '});
    query = '\n' + formattedQuery.replace(/^/gm, '            ') + '\n        ';
    query = query.replace(/`/g, '\\`');
    return query;
}

/**
 * Gets contents of the migration file.
 */
const getTemplate = (name: string, timestamp: number, upSqls: string[], downSqls: string[]): string => {
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

export const generate = async (connection: Connection) => {

    // Get mapping model name to table name
    const classesToTablesMap = connection.entityMetadatas.reduce((obj, entityMeta) => {
        obj[entityMeta.targetName] = entityMeta.tableName;
        return obj;
    });

    // Get source root directory
    const cliConfiguration = await loadConfiguration();
    const sourceRoot = join(process.cwd(), cliConfiguration.sourceRoot);

    // Each all models, store models info by table names
    const tablesInfo: Record<string, {tableClassName: string, moduleDir: string}> = {};
    const moduleDirs = fs.readdirSync(sourceRoot);
    for (const moduleName of moduleDirs) {
        if (fs.statSync(join(sourceRoot, moduleName)).isDirectory()) {
            const moduleDir = join(sourceRoot, moduleName);
            const moduleClassPath = join(moduleDir, '/infrastructure/' + lodash.upperFirst(moduleName) + 'Module.ts');

            if (fs.existsSync(moduleClassPath)) {
                const tableClassDir = join(sourceRoot, moduleName, 'infrastructure/tables');
                const tableFiles = fs.readdirSync(tableClassDir);
                for (const tableFile of tableFiles) {
                    const tableClassName = tableFile.replace(/\.ts$/, '');
                    const tableName = classesToTablesMap[tableClassName];

                    tablesInfo[tableName] = {
                        tableClassName,
                        moduleDir,
                    };
                }
            }
        }
    }

    // Generate migrations, separated by table names
    const migrationsByTables: Record<string, {upQueries: string[], downQueries: string[]}> = {};
    const sqlInMemory = await (new CustomRdbmsSchemaBuilder(connection)).log();
    for (const item of sqlInMemory.upTableQueries) {
        if (!migrationsByTables[item.tableName]) {
            migrationsByTables[item.tableName] = {
                upQueries: [],
                downQueries: [],
            };
        }
        migrationsByTables[item.tableName].upQueries.push(
            '        await queryRunner.query(`' + prettifyQuery(item.query.query) + '`' + queryParams(item.query.parameters) + ');'
        );
    }
    for (const item of sqlInMemory.downTableQueries) {
        migrationsByTables[item.tableName].downQueries.push(
            '        await queryRunner.query(`' + prettifyQuery(item.query.query) + '`' + queryParams(item.query.parameters) + ');'
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
            const moduleDir = tablesInfo[tableName].moduleDir;

            const fileContent = getTemplate(
                tableClassName,
                timestamp,
                migrationsByTables[tableName].upQueries,
                migrationsByTables[tableName].downQueries.reverse(),
            );
            const fileName = timestamp + '-' + tableClassName + '.ts';
            const path = join(moduleDir, '/infrastructure/migrations', fileName);

            // eslint-disable-next-line no-console
            console.log('info', '\t' + path);
            await CommandUtils.createFile(path, fileContent);
        }
    }
}