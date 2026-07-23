import {RdbmsSchemaBuilder} from 'typeorm/schema-builder/RdbmsSchemaBuilder';
import {EntityMetadata, Table, TableForeignKey, View} from 'typeorm';
import {CustomPostgresQueryRunner, TableSqlInMemory} from './CustomPostgresQueryRunner';

/**
 * Строит schema diff TypeORM и сохраняет принадлежность запросов к таблицам и views.
 */
export class CustomRdbmsSchemaBuilder extends RdbmsSchemaBuilder {
    async log(): Promise<TableSqlInMemory> {
        if (this.dataSource.options.type !== 'postgres') {
            throw new Error(`Migration generation supports PostgreSQL only, received "${this.dataSource.options.type}".`);
        }

        // Proxy runner добавляет контекст объекта схемы к запросам штатного TypeORM.
        const queryRunner = new CustomPostgresQueryRunner(this.dataSource.driver as any, 'master')
            .trackSchemaOperations();
        queryRunner.manager = this.dataSource.createEntityManager(queryRunner);
        this.queryRunner = queryRunner;

        try {
            // Загружаем реальное состояние таблиц и views до вычисления diff.
            const tablePaths = this.entityToSyncMetadatas.map(metadata => this.getTablePathCustom(metadata));
            const viewPaths = this.viewEntityToSyncMetadatas.map(metadata => this.getTablePathCustom(metadata));
            this.tables = await this.queryRunner.getTables(tablePaths);
            this.views = await this.queryRunner.getViews(viewPaths);

            this.queryRunner.enableSqlMemory();
            await this.executeSchemaSyncOperationsInProperOrder();

            // При включённом query cache учитываем изменения его служебной таблицы.
            if (this.dataSource.queryResultCache) {
                // TODO: проверить генерацию миграции для разных реализаций query cache.
                await this.dataSource.queryResultCache.synchronize(this.queryRunner);
            }

            return this.queryRunner.getMemorySql() as TableSqlInMemory;
        } finally {
            // SQL-memory нужно выключать даже перед release: некоторые драйверы переиспользуют runner.
            this.queryRunner.disableSqlMemory();
            await this.queryRunner.release();
        }
    }

    private getTablePathCustom(target: EntityMetadata | Table | View | TableForeignKey | string): string {
        const parsed = this.dataSource.driver.parseTableName(target);

        return this.dataSource.driver.buildTableName(
            parsed.tableName,
            parsed.schema || this.dataSource.driver.schema,
            parsed.database || this.dataSource.driver.database,
        );
    }
}
