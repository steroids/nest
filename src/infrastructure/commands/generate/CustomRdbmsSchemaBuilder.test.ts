import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {CustomPostgresQueryRunner} from './CustomPostgresQueryRunner';
import {CustomRdbmsSchemaBuilder} from './CustomRdbmsSchemaBuilder';

const createDataSource = (type = 'postgres') => {
    const dataSource: any = {
        options: {type},
        entityMetadatas: [{
            synchronize: true,
            tableType: 'view',
            tableName: 'metric_view',
        }],
        createEntityManager: jest.fn(() => ({})),
        queryResultCache: undefined,
    };
    dataSource.driver = {
        dataSource,
        database: 'metrics',
        schema: 'public',
        parseTableName: (target: any) => ({
            tableName: target.tableName || target.name || target,
            schema: target.schema,
            database: target.database,
        }),
        buildTableName: (tableName: string, schema?: string) => schema
            ? `${schema}.${tableName}`
            : tableName,
    };
    return dataSource;
};

describe('CustomRdbmsSchemaBuilder', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('loads existing views before comparing the schema', async () => {
        jest.spyOn(CustomPostgresQueryRunner.prototype, 'getTables').mockResolvedValue([]);
        const getViews = jest.spyOn(CustomPostgresQueryRunner.prototype, 'getViews').mockResolvedValue([]);
        jest.spyOn(CustomPostgresQueryRunner.prototype, 'enableSqlMemory').mockImplementation(() => undefined);
        jest.spyOn(CustomPostgresQueryRunner.prototype, 'disableSqlMemory').mockImplementation(() => undefined);
        jest.spyOn(CustomPostgresQueryRunner.prototype, 'getMemorySql').mockReturnValue({
            upTableQueries: [],
            downTableQueries: [],
        } as any);
        jest.spyOn(CustomPostgresQueryRunner.prototype, 'release').mockResolvedValue();

        const schemaBuilder = new CustomRdbmsSchemaBuilder(createDataSource());
        (schemaBuilder as any).executeSchemaSyncOperationsInProperOrder = jest.fn(async () => undefined);

        await schemaBuilder.log();

        expect(getViews).toHaveBeenCalledWith(['public.metric_view']);
    });

    it('rejects unsupported database drivers explicitly', async () => {
        const schemaBuilder = new CustomRdbmsSchemaBuilder(createDataSource('mysql'));

        await expect(schemaBuilder.log())
            .rejects.toThrow('Migration generation supports PostgreSQL only');
    });
});
