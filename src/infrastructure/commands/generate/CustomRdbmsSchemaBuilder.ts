import {Table} from 'typeorm-steroids/schema-builder/table/Table';
import {TableForeignKey} from 'typeorm-steroids/schema-builder/table/TableForeignKey';
import {EntityMetadata} from 'typeorm-steroids/metadata/EntityMetadata';
import {View} from 'typeorm-steroids/schema-builder/view/View';
import {RdbmsSchemaBuilder} from 'typeorm-steroids/schema-builder/RdbmsSchemaBuilder';
import {CustomPostgresQueryRunner, TableSqlInMemory} from './CustomPostgresQueryRunner';

export class CustomRdbmsSchemaBuilder extends RdbmsSchemaBuilder {

    async log(): Promise<TableSqlInMemory> {
        // Create query runner
        const queryRunner = new CustomPostgresQueryRunner(this.connection.driver as any, 'master');
        queryRunner.manager = this.connection.createEntityManager(queryRunner);
        this.queryRunner = queryRunner;

        try {
            // Flush the queryrunner table & view cache
            const tablePaths = this.entityToSyncMetadatas.map(metadata => this.getTablePathCustom(metadata));
            await this.queryRunner.getTables(tablePaths);
            await this.queryRunner.getViews([]);

            this.queryRunner.enableSqlMemory();
            await this.executeSchemaSyncOperationsInProperOrder();

            // if cache is enabled then perform cache-synchronization as well
            if (this.connection.queryResultCache) // todo: check this functionality
                await this.connection.queryResultCache.synchronize(this.queryRunner);

            return this.queryRunner.getMemorySql() as TableSqlInMemory;

        } finally {
            // its important to disable this mode despite the fact we are release query builder
            // because there exist drivers which reuse same query runner. Also its important to disable
            // sql memory after call of getMemorySql() method because last one flushes sql memory.
            this.queryRunner.disableSqlMemory();
            await this.queryRunner.release();
        }
    }

    private getTablePathCustom(target: EntityMetadata | Table | View | TableForeignKey | string): string {
        const parsed = this.connection.driver.parseTableName(target);

        return this.connection.driver.buildTableName(
            parsed.tableName,
            parsed.schema || this.connection.driver.schema,
            parsed.database || this.connection.driver.database
        );
    }

}
