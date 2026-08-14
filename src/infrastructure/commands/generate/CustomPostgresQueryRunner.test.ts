import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {Query} from 'typeorm/driver/Query';
import {Table} from 'typeorm/schema-builder/table/Table';
import {CustomPostgresQueryRunner} from './CustomPostgresQueryRunner';

const createQueryRunner = () => {
    const dataSource = {};
    const driver = {
        dataSource,
        parseTableName: (target: string | {name: string}) => {
            const objectPath = typeof target === 'string' ? target : target.name;
            return {
                tableName: objectPath.includes('.') ? objectPath.split('.').at(-1) : objectPath,
            };
        },
    };
    const runner = new CustomPostgresQueryRunner(driver as any, 'master');
    runner.enableSqlMemory();
    return runner;
};

describe('CustomPostgresQueryRunner', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('tracks table and view operations while delegating query storage to TypeORM', async () => {
        const runner = createQueryRunner();
        (runner as any).changeTableComment = async function changeTableComment() {
            await this.executeQueries(
                new Query('COMMENT ON TABLE "metrics" IS \'new\''),
                new Query('COMMENT ON TABLE "metrics" IS \'old\''),
            );
        };
        (runner as any).createView = async function createView() {
            await this.executeQueries(
                [
                    new Query('CREATE VIEW "metric_view" AS SELECT 1'),
                    new Query('INSERT INTO "typeorm_metadata"'),
                ],
                [
                    new Query('DROP VIEW "metric_view"'),
                    new Query('DELETE FROM "typeorm_metadata"'),
                ],
            );
        };
        const trackedRunner = runner.trackSchemaOperations();

        await trackedRunner.changeTableComment('public.metrics', 'new');
        await trackedRunner.createView({name: 'public.metric_view'} as any, true);

        const sqlInMemory = trackedRunner.getMemorySql();
        expect(sqlInMemory.upQueries).toHaveLength(3);
        expect(sqlInMemory.upTableQueries).toEqual([
            expect.objectContaining({
                tableName: 'metrics',
                objectType: 'table',
                isTableDeclaration: false,
            }),
            expect.objectContaining({
                tableName: 'metric_view',
                objectType: 'view',
                isTableDeclaration: true,
            }),
            expect.objectContaining({
                tableName: 'metric_view',
                objectType: 'view',
                isTableDeclaration: true,
            }),
        ]);
    });

    it('fails loudly when TypeORM adds an untracked schema operation', async () => {
        const runner = createQueryRunner();
        (runner as any).newTypeOrmOperation = async function newTypeOrmOperation() {
            await this.executeQueries(
                new Query('ALTER TABLE "metrics" SOMETHING NEW'),
                new Query('ALTER TABLE "metrics" UNDO SOMETHING NEW'),
            );
        };

        await expect((runner.trackSchemaOperations() as any).newTypeOrmOperation())
            .rejects.toThrow('TypeORM produced an untracked schema query');
    });

    it('clears tracked metadata together with TypeORM SQL memory', async () => {
        const runner = createQueryRunner();
        const trackedRunner = runner.trackSchemaOperations();

        await trackedRunner.createTable(new Table({name: 'metrics',
            columns: []}), false, false, false);
        expect(trackedRunner.getMemorySql().upQueries[0].query).toBe('CREATE TABLE "metrics" ()');
        expect(trackedRunner.getMemorySql().upTableQueries[0]).toEqual(expect.objectContaining({
            tableName: 'metrics',
            isTableDeclaration: true,
        }));

        trackedRunner.clearSqlMemory();

        expect(trackedRunner.getMemorySql().upTableQueries).toEqual([]);
        expect(trackedRunner.getMemorySql().upQueries).toEqual([]);
    });
});
