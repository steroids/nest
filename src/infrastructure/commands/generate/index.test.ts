import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {Query} from 'typeorm/driver/Query';
import {MigrationExecutor} from 'typeorm/migration/MigrationExecutor';
import {CustomRdbmsSchemaBuilder} from './CustomRdbmsSchemaBuilder';
import {TableQuery} from './CustomPostgresQueryRunner';
import {
    generate,
    hasPendingMigrations,
    MigrationGeneratorLogger,
    MigrationGeneratorOptions,
} from './index';
import {MigrationFilePlan} from './MigrationPlanner';

class TestTable {
}

const createDataSource = () => ({
    entityMetadatas: [{
        target: TestTable,
        targetName: TestTable.name,
        tableName: 'test_table',
        manyToManyRelations: [],
    }],
});

const createOptions = (hasPending = false) => {
    const logger: MigrationGeneratorLogger = {
        info: jest.fn(),
        error: jest.fn(),
    };
    const writeFiles = jest.fn(async (plans: MigrationFilePlan[]) => plans.map(plan => plan.filePath));
    const options: MigrationGeneratorOptions = {
        now: () => 1_700_000_000_000,
        fileExists: () => false,
        logger,
        resolveObjectFiles: async () => ({
            test_table: {
                className: TestTable.name,
                sourcePath: '/project/src/test/infrastructure/tables/TestTable.ts',
            },
        }),
        resolveMigrationsDir: () => '/project/src/test/infrastructure/migrations',
        writeFiles,
        hasPendingMigrations: async () => hasPending,
    };

    return {logger,
        options,
        writeFiles};
};

describe('migration generator', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('plans declarations before changes and gives every file a unique timestamp', async () => {
        jest.spyOn(CustomRdbmsSchemaBuilder.prototype, 'log').mockResolvedValue({
            upTableQueries: [
                new TableQuery('test_table', new Query('ALTER TABLE "test_table" ADD "id" integer'), true),
                new TableQuery('test_table', new Query('CREATE TABLE "audit" ("id" integer)')),
            ],
            downTableQueries: [],
        } as any);
        const {options, writeFiles} = createOptions();

        const result = await generate(createDataSource() as any, options);

        const plans = writeFiles.mock.calls[0][0];
        expect(plans).toHaveLength(2);
        expect(plans[0]).toEqual(expect.objectContaining({
            phase: 'declaration',
            timestamp: 1_700_000_000_000,
        }));
        expect(plans[0].content).toContain('ALTER TABLE');
        expect(plans[1]).toEqual(expect.objectContaining({
            phase: 'change',
            timestamp: 1_700_000_000_001,
        }));
        expect(plans[1].content).toContain('CREATE TABLE');
        expect(result.files).toEqual(plans.map(plan => plan.filePath));
    });

    it('handles a migration group that only has down queries', async () => {
        jest.spyOn(CustomRdbmsSchemaBuilder.prototype, 'log').mockResolvedValue({
            upTableQueries: [],
            downTableQueries: [
                new TableQuery('test_table', new Query('DROP TABLE "test_table"'), true),
            ],
        } as any);
        const {options, writeFiles} = createOptions();

        await generate(createDataSource() as any, options);

        const plans = writeFiles.mock.calls[0][0];
        expect(plans).toHaveLength(1);
        expect(plans[0].content).toContain('DROP TABLE');
    });

    it('fails before schema comparison when pending migrations exist', async () => {
        const log = jest.spyOn(CustomRdbmsSchemaBuilder.prototype, 'log');
        const {logger, options, writeFiles} = createOptions(true);

        await expect(generate(createDataSource() as any, options))
            .rejects.toThrow('Unapplied migrations detected');

        expect(logger.error).toHaveBeenCalled();
        expect(log).not.toHaveBeenCalled();
        expect(writeFiles).not.toHaveBeenCalled();
    });

    it('checks pending migrations without calling the verbose showMigrations API', async () => {
        const showMigrations = jest.fn();
        const dataSource = {
            showMigrations,
            options: {},
            driver: {
                options: {},
                database: 'metrics',
                buildTableName: (tableName: string) => tableName,
            },
        };
        jest.spyOn(MigrationExecutor.prototype, 'getPendingMigrations').mockResolvedValue([{}] as any);

        await expect(hasPendingMigrations(dataSource as any)).resolves.toBe(true);
        expect(showMigrations).not.toHaveBeenCalled();
    });

    it('validates all object paths before writing any files', async () => {
        jest.spyOn(CustomRdbmsSchemaBuilder.prototype, 'log').mockResolvedValue({
            upTableQueries: [
                new TableQuery('unknown_table', new Query('CREATE TABLE "unknown_table"'), true),
            ],
            downTableQueries: [],
        } as any);
        const {options, writeFiles} = createOptions();

        await expect(generate(createDataSource() as any, options))
            .rejects.toThrow('Cannot resolve source files for schema objects: unknown_table');

        expect(writeFiles).not.toHaveBeenCalled();
    });
});
