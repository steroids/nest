import {SqlInMemory} from 'typeorm/driver/SqlInMemory';
import {TableQuery} from './TableQuery';

/**
 * Расширяет SQL-memory TypeORM запросами, сгруппированными по таблицам и views.
 */
export class TableSqlInMemory extends SqlInMemory {
    upTableQueries: TableQuery[] = [];

    downTableQueries: TableQuery[] = [];
}
