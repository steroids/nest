import {Command} from 'nestjs-command';
import {Injectable} from '@nestjs/common';
import {Connection} from 'typeorm';
import * as lodash from 'lodash';
import {join} from 'path';
import * as fs from 'fs';
import {format} from '@sqltools/formatter/lib/sqlFormatter';
import {ConfigService} from '@nestjs/config';
import {loadConfiguration} from '@nestjs/cli/lib/utils/load-configuration';
import {CommandUtils} from 'typeorm/commands/CommandUtils';

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
                    for (const modelFile of modelFiles) {
                        const modelName = modelFile.replace(/\.ts$/, '');
                        const modelPath = join(modelsDir, modelFile);

                        const result = await this.generateMigrations(
                            moduleDir,
                            modelPath,
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

    protected async generateMigrations(moduleDir, modelPath, modelName, tableName): Promise<IMigrationData> {
        const connection = new Connection({
            ...this.configService.get('database'),
            entities: [modelPath],
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
