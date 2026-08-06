import {Query} from 'typeorm/driver/Query';
import {PostgresQueryRunner} from 'typeorm/driver/postgres/PostgresQueryRunner';
import {SchemaObjectType, TableQuery} from './TableQuery';
import {TableSqlInMemory} from './TableSqlInMemory';

export {SchemaObjectType, TableQuery} from './TableQuery';
export {TableSqlInMemory} from './TableSqlInMemory';

type TrackingContext = {
    objectName: string,
    objectType: SchemaObjectType,
    isDeclaration: boolean,
};

type TrackedMethod = {
    objectType: SchemaObjectType,
    isDeclaration?: boolean,
};

// Методы меняют таблицу, но не создают и не удаляют сам объект схемы.
const TABLE_CHANGE_METHODS = [
    'renameTable',
    'changeTableComment',
    'addColumn',
    'addColumns',
    'renameColumn',
    'changeColumn',
    'changeColumns',
    'dropColumn',
    'dropColumns',
    'createPrimaryKey',
    'updatePrimaryKeys',
    'dropPrimaryKey',
    'createUniqueConstraint',
    'createUniqueConstraints',
    'dropUniqueConstraint',
    'dropUniqueConstraints',
    'createCheckConstraint',
    'createCheckConstraints',
    'dropCheckConstraint',
    'dropCheckConstraints',
    'createExclusionConstraint',
    'createExclusionConstraints',
    'dropExclusionConstraint',
    'dropExclusionConstraints',
    'createForeignKey',
    'createForeignKeys',
    'dropForeignKey',
    'dropForeignKeys',
    'createIndex',
    'createIndices',
    'dropIndex',
    'dropIndices',
] as const;

const VIEW_CHANGE_METHODS = [
    'createViewIndex',
    'createViewIndices',
    'dropViewIndex',
    'dropViewIndices',
] as const;

const TRACKED_METHODS: Record<string, TrackedMethod> = {
    createTable: {objectType: 'table',
        isDeclaration: true},
    dropTable: {objectType: 'table',
        isDeclaration: true},
    createView: {objectType: 'view',
        isDeclaration: true},
    dropView: {objectType: 'view',
        isDeclaration: true},
};

for (const method of TABLE_CHANGE_METHODS) {
    TRACKED_METHODS[method] = {objectType: 'table'};
}
for (const method of VIEW_CHANGE_METHODS) {
    TRACKED_METHODS[method] = {objectType: 'view'};
}

/**
 * Добавляет к SQL из штатного PostgresQueryRunner информацию о таблице или view.
 */
export class CustomPostgresQueryRunner extends PostgresQueryRunner {
    private upTableQueries: TableQuery[] = [];

    private downTableQueries: TableQuery[] = [];

    private trackingContexts: TrackingContext[] = [];

    private trackingProxy?: this;

    /**
     * Возвращает proxy, который отслеживает schema-операции, не подменяя SQL-логику TypeORM.
     */
    trackSchemaOperations(): this {
        if (!this.trackingProxy) {
            this.trackingProxy = new Proxy(this, {
                get: (target, property) => {
                    const value = Reflect.get(target, property, target);
                    if (typeof value !== 'function') {
                        return value;
                    }

                    const trackedMethod = typeof property === 'string'
                        ? TRACKED_METHODS[property]
                        : undefined;
                    if (!trackedMethod) {
                        // Нетрековые методы привязываем к оригинальному runner, чтобы не менять их this.
                        return value.bind(target);
                    }

                    return (...args: unknown[]) => this.trackOperation(
                        args[0],
                        trackedMethod,
                        () => value.apply(target, args),
                    );
                },
            }) as this;
        }

        return this.trackingProxy;
    }

    enableSqlMemory(): void {
        this.resetTrackedQueries();
        super.enableSqlMemory();
    }

    disableSqlMemory(): void {
        this.resetTrackedQueries();
        super.disableSqlMemory();
    }

    clearSqlMemory(): void {
        this.resetTrackedQueries();
        super.clearSqlMemory();
    }

    getMemorySql(): TableSqlInMemory {
        const sqlInMemory = super.getMemorySql() as TableSqlInMemory;
        sqlInMemory.upTableQueries = [...this.upTableQueries];
        sqlInMemory.downTableQueries = [...this.downTableQueries];
        return sqlInMemory;
    }

    protected async executeQueries(
        upQueries: Query | Query[],
        downQueries: Query | Query[],
    ): Promise<void> {
        const context = this.trackingContexts[this.trackingContexts.length - 1];
        if (this.sqlMemoryMode && !context) {
            // Новые schema-операции TypeORM нельзя терять молча: их нужно явно добавить в tracking.
            throw new Error('TypeORM produced an untracked schema query. Add its operation to TRACKED_METHODS.');
        }

        if (context) {
            this.upTableQueries.push(...this.toTableQueries(upQueries, context));
            this.downTableQueries.push(...this.toTableQueries(downQueries, context));
        }

        await super.executeQueries(upQueries, downQueries);
    }

    private async trackOperation(
        target: unknown,
        trackedMethod: TrackedMethod,
        operation: () => unknown,
    ): Promise<unknown> {
        const objectName = this.getObjectName(target);
        if (!objectName) {
            return operation();
        }

        this.trackingContexts.push({
            objectName,
            objectType: trackedMethod.objectType,
            isDeclaration: trackedMethod.isDeclaration || false,
        });
        try {
            // Контекст действует на все вложенные вызовы штатного runner до завершения операции.
            return await operation();
        } finally {
            this.trackingContexts.pop();
        }
    }

    private getObjectName(target: unknown): string | undefined {
        const objectPath = typeof target === 'string'
            ? target
            : (target as {name?: string} | undefined)?.name;
        if (!objectPath) {
            return undefined;
        }

        return this.driver.parseTableName(objectPath).tableName;
    }

    private toTableQueries(
        queries: Query | Query[],
        context: TrackingContext,
    ): TableQuery[] {
        const normalizedQueries = Array.isArray(queries) ? queries : [queries];
        return normalizedQueries.map(query => new TableQuery(
            context.objectName,
            query,
            context.isDeclaration,
            context.objectType,
        ));
    }

    private resetTrackedQueries(): void {
        this.upTableQueries = [];
        this.downTableQueries = [];
        this.trackingContexts = [];
    }
}
