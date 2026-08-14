import {Query} from 'typeorm/driver/Query';

/** Тип объекта базы данных, к которому относится запрос. */
export type SchemaObjectType = 'table' | 'view';

/**
 * SQL-запрос с информацией об объекте схемы, к которому он относится.
 */
export class TableQuery {
    constructor(
        public tableName: string,
        public query: Query,
        public isTableDeclaration = false,
        public objectType: SchemaObjectType = 'table',
    ) {
    }
}
