import {QueryRunner} from 'typeorm/query-runner/QueryRunner';
import {Table} from 'typeorm/schema-builder/table/Table';
import {TableCheck} from 'typeorm/schema-builder/table/TableCheck';
import {TableColumn} from 'typeorm/schema-builder/table/TableColumn';
import {TableExclusion} from 'typeorm/schema-builder/table/TableExclusion';
import {TableForeignKey} from 'typeorm/schema-builder/table/TableForeignKey';
import {TableIndex} from 'typeorm/schema-builder/table/TableIndex';
import {TableUnique} from 'typeorm/schema-builder/table/TableUnique';
import {OrmUtils} from 'typeorm/util/OrmUtils';
import {Query} from 'typeorm/driver/Query';
import {TypeORMError} from 'typeorm/error/TypeORMError';
import {MetadataTableType} from 'typeorm/driver/types/MetadataTableType';
import {PostgresQueryRunner} from 'typeorm/driver/postgres/PostgresQueryRunner';
import {SqlInMemory} from 'typeorm/driver/SqlInMemory';

export class TableQuery {
    constructor(public tableName: string, public query: Query) {
    }
}

export class TableSqlInMemory extends SqlInMemory {
    upTableQueries: TableQuery[] = [];
    downTableQueries: TableQuery[] = [];
}

/**
 * Runs queries on a single postgres database connection.
 */
export class CustomPostgresQueryRunner extends PostgresQueryRunner implements QueryRunner {

    /**
     * Sql-s stored if "sql in memory" mode is enabled.
     */
    protected sqlInMemory: TableSqlInMemory = new TableSqlInMemory();

    /**
     * Creates a new table.
     */
    async createTable(table: Table, ifNotExist: boolean = false, createForeignKeys: boolean = true, createIndices: boolean = true): Promise<void> {
        if (ifNotExist) {
            const isTableExist = await this.hasTable(table);
            if (isTableExist) return Promise.resolve();
        }
        const upQueries: TableQuery[] = [];
        const downQueries: TableQuery[] = [];

        // if table have column with ENUM type, we must create this type in postgres.
        const enumColumns = table.columns.filter(column => column.type === "enum" || column.type === "simple-enum")
        const createdEnumTypes: string[] = []
        for (const column of enumColumns) {
            // TODO: Should also check if values of existing type matches expected ones
            const hasEnum = await this.hasEnumType(table, column);
            const enumName = this.buildEnumName(table, column)

            // if enum with the same "enumName" is defined more then once, me must prevent double creation
            if (!hasEnum && createdEnumTypes.indexOf(enumName) === -1) {
                createdEnumTypes.push(enumName)
                upQueries.push(new TableQuery(table.name, this.createEnumTypeSql(table, column, enumName)));
                downQueries.push(new TableQuery(table.name, this.dropEnumTypeSql(table, column, enumName)));
            }
        }

        // if table have column with generated type, we must add the expression to the metadata table
        const generatedColumns = table.columns.filter(column => column.generatedType === "STORED" && column.asExpression)
        for (const column of generatedColumns) {
            const tableNameWithSchema = (await this.getTableNameWithSchema(table.name)).split('.');
            const tableName = tableNameWithSchema[1];
            const schema = tableNameWithSchema[0];

            const insertQuery = this.insertTypeormMetadataSql({
                database: this.driver.database,
                schema,
                table: tableName,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression
            })

            const deleteQuery = this.deleteTypeormMetadataSql({
                database: this.driver.database,
                schema,
                table: tableName,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name
            })

            upQueries.push(new TableQuery(tableName, deleteQuery));
            upQueries.push(new TableQuery(tableName, insertQuery));
            downQueries.push(new TableQuery(tableName, deleteQuery));
        }

        upQueries.push(new TableQuery(table.name, this.createTableSql(table, createForeignKeys)));
        downQueries.push(new TableQuery(table.name, this.dropTableSql(table)));

        // if createForeignKeys is true, we must drop created foreign keys in down query.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (createForeignKeys)
            table.foreignKeys.forEach(foreignKey => downQueries.push(new TableQuery(table.name, this.dropForeignKeySql(table, foreignKey))));

        if (createIndices) {
            table.indices.forEach(index => {

                // new index may be passed without name. In this case we generate index name manually.
                if (!index.name)
                    index.name = this.connection.namingStrategy.indexName(table, index.columnNames, index.where);
                upQueries.push(new TableQuery(table.name, this.createIndexSql(table, index)));
                downQueries.push(new TableQuery(table.name, this.dropIndexSql(table, index)));
            });
        }

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Drops the table.
     */
    async dropTable(target: Table | string, ifExist?: boolean, dropForeignKeys: boolean = true, dropIndices: boolean = true): Promise<void> {// It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
        // to perform drop queries for foreign keys and indices.
        if (ifExist) {
            const isTableExist = await this.hasTable(target);
            if (!isTableExist) return Promise.resolve();
        }

        // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
        const createForeignKeys: boolean = dropForeignKeys;
        const tablePath = this.getTablePath(target);
        const table = await this.getCachedTable(tablePath);
        const upQueries: TableQuery[] = [];
        const downQueries: TableQuery[] = [];


        if (dropIndices) {
            table.indices.forEach(index => {
                upQueries.push(new TableQuery(table.name, this.dropIndexSql(table, index)));
                downQueries.push(new TableQuery(table.name, this.createIndexSql(table, index)));
            });
        }

        if (dropForeignKeys)
            table.foreignKeys.forEach(foreignKey => upQueries.push(new TableQuery(table.name, this.dropForeignKeySql(table, foreignKey))));

        upQueries.push(new TableQuery(table.name, this.dropTableSql(table)));
        downQueries.push(new TableQuery(table.name, this.createTableSql(table, createForeignKeys)));

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrName: Table | string, column: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: TableQuery[] = [];
        const downQueries: TableQuery[] = [];

        if (column.type === "enum" || column.type === "simple-enum") {
            const hasEnum = await this.hasEnumType(table, column);
            if (!hasEnum) {
                upQueries.push(new TableQuery(table.name, this.createEnumTypeSql(table, column)));
                downQueries.push(new TableQuery(table.name, this.dropEnumTypeSql(table, column)));
            }
        }

        upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
            ADD ${this.buildCreateColumnSql(table, column)}`)));
        downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
            DROP COLUMN "${column.name}"`)));

        // create or update primary key constraint
        if (column.isPrimary) {
            const primaryColumns = clonedTable.primaryColumns;
            // if table already have primary key, me must drop it and recreate again
            if (primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                    DROP CONSTRAINT "${pkName}"`)));
                downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                    ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`)));
            }

            primaryColumns.push(column);
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`)));
            downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                DROP CONSTRAINT "${pkName}"`)));
        }

        // create column index
        const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
        if (columnIndex) {
            upQueries.push(new TableQuery(table.name, this.createIndexSql(table, columnIndex)));
            downQueries.push(new TableQuery(table.name, this.dropIndexSql(table, columnIndex)));
        }

        // create unique constraint
        if (column.isUnique) {
            const uniqueConstraint = new TableUnique({
                name: this.connection.namingStrategy.uniqueConstraintName(table, [column.name]),
                columnNames: [column.name]
            });
            clonedTable.uniques.push(uniqueConstraint);
            upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${column.name}")`)));
            downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                DROP CONSTRAINT "${uniqueConstraint.name}"`)));
        }

        if (column.generatedType === "STORED" && column.asExpression) {
            const tableNameWithSchema = (await this.getTableNameWithSchema(table.name)).split('.');
            const tableName = tableNameWithSchema[1];
            const schema = tableNameWithSchema[0];

            const insertQuery = this.insertTypeormMetadataSql({
                database: this.driver.database,
                schema,
                table: tableName,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression
            })

            const deleteQuery = this.deleteTypeormMetadataSql({
                database: this.driver.database,
                schema,
                table: tableName,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name
            })

            upQueries.push(new TableQuery(tableName, deleteQuery));
            upQueries.push(new TableQuery(tableName, insertQuery));
            downQueries.push(new TableQuery(tableName, deleteQuery));
        }

        // create column's comment
        if (column.comment) {
            upQueries.push(new TableQuery(table.name, new Query(`COMMENT ON COLUMN ${this.escapePath(table)}."${column.name}" IS ${this.escapeComment(column.comment)}`)));
            downQueries.push(new TableQuery(table.name, new Query(`COMMENT ON COLUMN ${this.escapePath(table)}."${column.name}" IS ${this.escapeComment(column.comment)}`)));
        }

        await this.executeQueries(upQueries, downQueries);

        clonedTable.addColumn(column);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableOrName: Table | string, oldTableColumnOrName: TableColumn | string, newTableColumnOrName: TableColumn | string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(c => c.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new TypeORMError(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);

        let newColumn;
        if (newTableColumnOrName instanceof TableColumn) {
            newColumn = newTableColumnOrName;
        } else {
            newColumn = oldColumn.clone();
            newColumn.name = newTableColumnOrName;
        }

        return this.changeColumn(table, oldColumn, newColumn);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(tableOrName: Table | string, oldTableColumnOrName: TableColumn | string, newColumn: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        let clonedTable = table.clone();
        const upQueries: TableQuery[] = [];
        const downQueries: TableQuery[] = [];
        let defaultValueChanged = false

        const oldColumn = oldTableColumnOrName instanceof TableColumn
            ? oldTableColumnOrName
            : table.columns.find(column => column.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new TypeORMError(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);


        if (oldColumn.type !== newColumn.type
            || oldColumn.length !== newColumn.length
            || newColumn.isArray !== oldColumn.isArray
            || (!oldColumn.generatedType && newColumn.generatedType === "STORED")
            || (oldColumn.asExpression !== newColumn.asExpression && newColumn.generatedType === "STORED")) {
            // To avoid data conversion, we just recreate column
            await this.dropColumn(table, oldColumn);
            await this.addColumn(table, newColumn);

            // update cloned table
            clonedTable = table.clone();

        } else {
            if (oldColumn.name !== newColumn.name) {
                // rename column
                upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                    RENAME COLUMN "${oldColumn.name}" TO "${newColumn.name}"`)));
                downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                    RENAME COLUMN "${newColumn.name}" TO "${oldColumn.name}"`)));

                // rename ENUM type
                if (oldColumn.type === "enum" || oldColumn.type === "simple-enum") {
                    const oldEnumType = await this.getUserDefinedTypeName(table, oldColumn);
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TYPE "${oldEnumType.schema}"."${oldEnumType.name}" RENAME TO ${this.buildEnumName(table, newColumn, false)}`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TYPE ${this.buildEnumName(table, newColumn)} RENAME TO "${oldEnumType.name}"`)));
                }

                // rename column primary key constraint
                if (oldColumn.isPrimary === true) {
                    const primaryColumns = clonedTable.primaryColumns;

                    // build old primary constraint name
                    const columnNames = primaryColumns.map(column => column.name);
                    const oldPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);

                    // replace old column name with new column name
                    columnNames.splice(columnNames.indexOf(oldColumn.name), 1);
                    columnNames.push(newColumn.name);

                    // build new primary constraint name
                    const newPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);

                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`)));
                }

                // rename column sequence
                if (oldColumn.isGenerated === true && newColumn.generationStrategy === "increment") {
                    const sequencePath = this.buildSequencePath(table, oldColumn.name);
                    const sequenceName = this.buildSequenceName(table, oldColumn.name);

                    const newSequencePath = this.buildSequencePath(table, newColumn.name);
                    const newSequenceName = this.buildSequenceName(table, newColumn.name);

                    const up = `ALTER SEQUENCE ${this.escapePath(sequencePath)} RENAME TO "${newSequenceName}"`;
                    const down = `ALTER SEQUENCE ${this.escapePath(newSequencePath)} RENAME TO "${sequenceName}"`;
                    upQueries.push(new TableQuery(table.name, new Query(up)));
                    downQueries.push(new TableQuery(table.name, new Query(down)));
                }

                // rename unique constraints
                clonedTable.findColumnUniques(oldColumn).forEach(unique => {
                    // build new constraint name
                    unique.columnNames.splice(unique.columnNames.indexOf(oldColumn.name), 1);
                    unique.columnNames.push(newColumn.name);
                    const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(clonedTable, unique.columnNames);

                    // build queries
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        RENAME CONSTRAINT "${unique.name}" TO "${newUniqueName}"`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        RENAME CONSTRAINT "${newUniqueName}" TO "${unique.name}"`)));

                    // replace constraint name
                    unique.name = newUniqueName;
                });

                // rename index constraints
                clonedTable.findColumnIndices(oldColumn).forEach(index => {
                    // build new constraint name
                    index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                    index.columnNames.push(newColumn.name);
                    const {schema} = this.driver.parseTableName(table);
                    const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);

                    // build queries
                    const up = schema ? `ALTER INDEX "${schema}"."${index.name}" RENAME TO "${newIndexName}"` : `ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`;
                    const down = schema ? `ALTER INDEX "${schema}"."${newIndexName}" RENAME TO "${index.name}"` : `ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`;
                    upQueries.push(new TableQuery(table.name, new Query(up)));
                    downQueries.push(new TableQuery(table.name, new Query(down)));

                    // replace constraint name
                    index.name = newIndexName;
                });

                // rename foreign key constraints
                clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
                    // build new constraint name
                    foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                    foreignKey.columnNames.push(newColumn.name);
                    const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames, this.getTablePath(foreignKey), foreignKey.referencedColumnNames);

                    // build queries
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`)));

                    // replace constraint name
                    foreignKey.name = newForeignKeyName;
                });

                // rename old column in the Table object
                const oldTableColumn = clonedTable.columns.find(column => column.name === oldColumn.name);
                clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn!)].name = newColumn.name;
                oldColumn.name = newColumn.name;
            }

            if (newColumn.precision !== oldColumn.precision || newColumn.scale !== oldColumn.scale) {
                upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                    ALTER COLUMN "${newColumn.name}" TYPE ${this.driver.createFullType(newColumn)}`)));
                downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                    ALTER COLUMN "${newColumn.name}" TYPE ${this.driver.createFullType(oldColumn)}`)));
            }

            if (
                (newColumn.type === "enum" || newColumn.type === "simple-enum")
                && (oldColumn.type === "enum" || oldColumn.type === "simple-enum")
                && (!OrmUtils.isArraysEqual(newColumn.enum!, oldColumn.enum!) || newColumn.enumName !== oldColumn.enumName)
            ) {
                const arraySuffix = newColumn.isArray ? "[]" : "";

                // "public"."new_enum"
                const newEnumName = this.buildEnumName(table, newColumn);

                // "public"."old_enum"
                const oldEnumName = this.buildEnumName(table, oldColumn);

                // "old_enum"
                const oldEnumNameWithoutSchema = this.buildEnumName(table, oldColumn, false);

                //"public"."old_enum_old"
                const oldEnumNameWithSchema_old = this.buildEnumName(table, oldColumn, true, false, true);

                //"old_enum_old"
                const oldEnumNameWithoutSchema_old = this.buildEnumName(table, oldColumn, false, false, true);

                // rename old ENUM
                upQueries.push(new TableQuery(table.name, new Query(`ALTER TYPE ${oldEnumName} RENAME TO ${oldEnumNameWithoutSchema_old}`)));
                downQueries.push(new TableQuery(table.name, new Query(`ALTER TYPE ${oldEnumNameWithSchema_old} RENAME TO ${oldEnumNameWithoutSchema}`)));

                // create new ENUM
                upQueries.push(new TableQuery(table.name, this.createEnumTypeSql(table, newColumn, newEnumName)));
                downQueries.push(new TableQuery(table.name, this.dropEnumTypeSql(table, newColumn, newEnumName)));

                // if column have default value, we must drop it to avoid issues with type casting
                if (oldColumn.default !== null && oldColumn.default !== undefined) {
                    // mark default as changed to prevent double update
                    defaultValueChanged = true
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${oldColumn.name}" DROP DEFAULT`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${oldColumn.name}" SET DEFAULT ${oldColumn.default}`)));
                }

                // build column types
                const upType = `${newEnumName}${arraySuffix} USING "${newColumn.name}"::"text"::${newEnumName}${arraySuffix}`;
                const downType = `${oldEnumNameWithSchema_old}${arraySuffix} USING "${newColumn.name}"::"text"::${oldEnumNameWithSchema_old}${arraySuffix}`;

                // update column to use new type
                upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                    ALTER COLUMN "${newColumn.name}" TYPE ${upType}`)));
                downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                    ALTER COLUMN "${newColumn.name}" TYPE ${downType}`)));

                // restore column default or create new one
                if (newColumn.default !== null && newColumn.default !== undefined) {
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${newColumn.name}" DROP DEFAULT`)));
                }

                // remove old ENUM
                upQueries.push(new TableQuery(table.name, this.dropEnumTypeSql(table, oldColumn, oldEnumNameWithSchema_old)));
                downQueries.push(new TableQuery(table.name, this.createEnumTypeSql(table, oldColumn, oldEnumNameWithSchema_old)));
            }

            if (oldColumn.isNullable !== newColumn.isNullable) {
                if (newColumn.isNullable) {
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${oldColumn.name}" DROP NOT NULL`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${oldColumn.name}" SET NOT NULL`)));
                } else {
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${oldColumn.name}" SET NOT NULL`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${oldColumn.name}" DROP NOT NULL`)));
                }
            }

            if (oldColumn.comment !== newColumn.comment) {
                upQueries.push(new TableQuery(table.name, new Query(`COMMENT ON COLUMN ${this.escapePath(table)}."${oldColumn.name}" IS ${this.escapeComment(newColumn.comment)}`)));
                downQueries.push(new TableQuery(table.name, new Query(`COMMENT ON COLUMN ${this.escapePath(table)}."${newColumn.name}" IS ${this.escapeComment(oldColumn.comment)}`)));
            }

            if (newColumn.isPrimary !== oldColumn.isPrimary) {
                const primaryColumns = clonedTable.primaryColumns;

                // if primary column state changed, we must always drop existed constraint.
                if (primaryColumns.length > 0) {
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        DROP CONSTRAINT "${pkName}"`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`)));
                }

                if (newColumn.isPrimary === true) {
                    primaryColumns.push(newColumn);
                    // update column in table
                    const column = clonedTable.columns.find(column => column.name === newColumn.name);
                    column!.isPrimary = true;
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        DROP CONSTRAINT "${pkName}"`)));

                } else {
                    const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
                    primaryColumns.splice(primaryColumns.indexOf(primaryColumn!), 1);

                    // update column in table
                    const column = clonedTable.columns.find(column => column.name === newColumn.name);
                    column!.isPrimary = false;

                    // if we have another primary keys, we must recreate constraint.
                    if (primaryColumns.length > 0) {
                        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, primaryColumns.map(column => column.name));
                        const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                        upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                            ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`)));
                        downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                            DROP CONSTRAINT "${pkName}"`)));
                    }
                }
            }

            if (newColumn.isUnique !== oldColumn.isUnique) {
                if (newColumn.isUnique === true) {
                    const uniqueConstraint = new TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(table, [newColumn.name]),
                        columnNames: [newColumn.name]
                    });
                    clonedTable.uniques.push(uniqueConstraint);
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${newColumn.name}")`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        DROP CONSTRAINT "${uniqueConstraint.name}"`)));

                } else {
                    const uniqueConstraint = clonedTable.uniques.find(unique => {
                        return unique.columnNames.length === 1 && !!unique.columnNames.find(columnName => columnName === newColumn.name);
                    });
                    clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint!), 1);
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        DROP CONSTRAINT "${uniqueConstraint!.name}"`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ADD CONSTRAINT "${uniqueConstraint!.name}" UNIQUE ("${newColumn.name}")`)));
                }
            }

            if (oldColumn.isGenerated !== newColumn.isGenerated &&
                newColumn.generationStrategy !== "uuid" &&
                newColumn.generationStrategy !== "identity"
            ) {
                if (newColumn.isGenerated === true) {
                    upQueries.push(new TableQuery(table.name, new Query(`CREATE SEQUENCE IF NOT EXISTS ${this.escapePath(this.buildSequencePath(table, newColumn))} OWNED BY ${this.escapePath(table)}."${newColumn.name}"`)));
                    downQueries.push(new TableQuery(table.name, new Query(`DROP SEQUENCE ${this.escapePath(this.buildSequencePath(table, newColumn))}`)));

                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${newColumn.name}" SET DEFAULT nextval('${this.escapePath(this.buildSequencePath(table, newColumn))}')`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${newColumn.name}" DROP DEFAULT`)));

                } else {
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${newColumn.name}" DROP DEFAULT`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${newColumn.name}" SET DEFAULT nextval('${this.escapePath(this.buildSequencePath(table, newColumn))}')`)));

                    upQueries.push(new TableQuery(table.name, new Query(`DROP SEQUENCE ${this.escapePath(this.buildSequencePath(table, newColumn))}`)));
                    downQueries.push(new TableQuery(table.name, new Query(`CREATE SEQUENCE IF NOT EXISTS ${this.escapePath(this.buildSequencePath(table, newColumn))} OWNED BY ${this.escapePath(table)}."${newColumn.name}"`)));
                }
            }

            // the default might have changed when the enum changed
            if (newColumn.default !== oldColumn.default && !defaultValueChanged) {
                if (newColumn.default !== null && newColumn.default !== undefined) {
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`)));

                    if (oldColumn.default !== null && oldColumn.default !== undefined) {
                        downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                            ALTER COLUMN "${newColumn.name}" SET DEFAULT ${oldColumn.default}`)));
                    } else {
                        downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                            ALTER COLUMN "${newColumn.name}" DROP DEFAULT`)));
                    }

                } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                    upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${newColumn.name}" DROP DEFAULT`)));
                    downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ALTER COLUMN "${newColumn.name}" SET DEFAULT ${oldColumn.default}`)));
                }
            }

            if ((newColumn.spatialFeatureType || "").toLowerCase() !== (oldColumn.spatialFeatureType || "").toLowerCase() || newColumn.srid !== oldColumn.srid) {
                upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                    ALTER COLUMN "${newColumn.name}" TYPE ${this.driver.createFullType(newColumn)}`)));
                downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                    ALTER COLUMN "${newColumn.name}" TYPE ${this.driver.createFullType(oldColumn)}`)));
            }

            if (newColumn.generatedType !== oldColumn.generatedType) {
                // Convert generated column data to normal column
                if (!newColumn.generatedType || newColumn.generatedType === "VIRTUAL") {
                    // We can copy the generated data to the new column
                    const tableNameWithSchema = (await this.getTableNameWithSchema(table.name)).split('.');
                    const tableName = tableNameWithSchema[1];
                    const schema = tableNameWithSchema[0];

                    upQueries.push(new TableQuery(tableName, new Query(`ALTER TABLE ${this.escapePath(table)}
                        RENAME COLUMN "${oldColumn.name}" TO "TEMP_OLD_${oldColumn.name}"`)));
                    upQueries.push(new TableQuery(tableName, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ADD ${this.buildCreateColumnSql(table, newColumn)}`)));
                    upQueries.push(new TableQuery(tableName, new Query(`UPDATE ${this.escapePath(table)}
                                                                        SET "${newColumn.name}" = "TEMP_OLD_${oldColumn.name}"`)));
                    upQueries.push(new TableQuery(tableName, new Query(`ALTER TABLE ${this.escapePath(table)}
                        DROP COLUMN "TEMP_OLD_${oldColumn.name}"`)));
                    upQueries.push(new TableQuery(tableName, this.deleteTypeormMetadataSql({
                        database: this.driver.database,
                        schema,
                        table: tableName,
                        type: MetadataTableType.GENERATED_COLUMN,
                        name: oldColumn.name
                    })));
                    // However, we can't copy it back on downgrade. It needs to regenerate.
                    downQueries.push(new TableQuery(tableName, new Query(`ALTER TABLE ${this.escapePath(table)}
                        DROP COLUMN "${newColumn.name}"`)));
                    downQueries.push(new TableQuery(tableName, new Query(`ALTER TABLE ${this.escapePath(table)}
                        ADD ${this.buildCreateColumnSql(table, oldColumn)}`)));
                    downQueries.push(new TableQuery(tableName, this.deleteTypeormMetadataSql({
                        database: this.driver.database,
                        schema,
                        table: tableName,
                        type: MetadataTableType.GENERATED_COLUMN,
                        name: newColumn.name
                    })));
                    downQueries.push(new TableQuery(tableName, this.insertTypeormMetadataSql({
                        database: this.driver.database,
                        schema,
                        table: tableName,
                        type: MetadataTableType.GENERATED_COLUMN,
                        name: oldColumn.name,
                        value: oldColumn.asExpression
                    })));
                }
            }

        }

        await this.executeQueries(upQueries, downQueries);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(tableOrName: Table | string, columnOrName: TableColumn | string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const column = columnOrName instanceof TableColumn ? columnOrName : table.findColumnByName(columnOrName);
        if (!column)
            throw new TypeORMError(`Column "${columnOrName}" was not found in table "${table.name}"`);

        const clonedTable = table.clone();
        const upQueries: TableQuery[] = [];
        const downQueries: TableQuery[] = [];

        // drop primary key constraint
        if (column.isPrimary) {
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, clonedTable.primaryColumns.map(column => column.name));
            const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
            upQueries.push(new TableQuery(clonedTable.name, new Query(`ALTER TABLE ${this.escapePath(clonedTable)}
                DROP CONSTRAINT "${pkName}"`)));
            downQueries.push(new TableQuery(clonedTable.name, new Query(`ALTER TABLE ${this.escapePath(clonedTable)}
                ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`)));

            // update column in table
            const tableColumn = clonedTable.findColumnByName(column.name);
            tableColumn!.isPrimary = false;

            // if primary key have multiple columns, we must recreate it without dropped column
            if (clonedTable.primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, clonedTable.primaryColumns.map(column => column.name));
                const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
                upQueries.push(new TableQuery(clonedTable.name, new Query(`ALTER TABLE ${this.escapePath(clonedTable)}
                    ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`)));
                downQueries.push(new TableQuery(clonedTable.name, new Query(`ALTER TABLE ${this.escapePath(clonedTable)}
                    DROP CONSTRAINT "${pkName}"`)));
            }
        }

        // drop column index
        const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
        if (columnIndex) {
            clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
            upQueries.push(new TableQuery(table.name, this.dropIndexSql(table, columnIndex)));
            downQueries.push(new TableQuery(table.name, this.createIndexSql(table, columnIndex)));
        }

        // drop column check
        const columnCheck = clonedTable.checks.find(check => !!check.columnNames && check.columnNames.length === 1 && check.columnNames[0] === column.name);
        if (columnCheck) {
            clonedTable.checks.splice(clonedTable.checks.indexOf(columnCheck), 1);
            upQueries.push(new TableQuery(table.name, this.dropCheckConstraintSql(table, columnCheck)));
            downQueries.push(new TableQuery(table.name, this.createCheckConstraintSql(table, columnCheck)));
        }

        // drop column unique
        const columnUnique = clonedTable.uniques.find(unique => unique.columnNames.length === 1 && unique.columnNames[0] === column.name);
        if (columnUnique) {
            clonedTable.uniques.splice(clonedTable.uniques.indexOf(columnUnique), 1);
            upQueries.push(new TableQuery(table.name, this.dropUniqueConstraintSql(table, columnUnique)));
            downQueries.push(new TableQuery(table.name, this.createUniqueConstraintSql(table, columnUnique)));
        }

        upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
            DROP COLUMN "${column.name}"`)));
        downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
            ADD ${this.buildCreateColumnSql(table, column)}`)));

        // drop enum type
        if (column.type === "enum" || column.type === "simple-enum") {
            const hasEnum = await this.hasEnumType(table, column);
            if (hasEnum) {
                const enumType = await this.getUserDefinedTypeName(table, column);
                const escapedEnumName = `"${enumType.schema}"."${enumType.name}"`;
                upQueries.push(new TableQuery(table.name, this.dropEnumTypeSql(table, column, escapedEnumName)));
                downQueries.push(new TableQuery(table.name, this.createEnumTypeSql(table, column, escapedEnumName)));
            }
        }

        if (column.generatedType === "STORED") {
            const tableNameWithSchema = (await this.getTableNameWithSchema(table.name)).split('.');
            const tableName = tableNameWithSchema[1];
            const schema = tableNameWithSchema[0];
            const insertQuery = this.deleteTypeormMetadataSql({
                database: this.driver.database,
                schema,
                table: tableName,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name
            })
            const deleteQuery = this.insertTypeormMetadataSql({
                database: this.driver.database,
                schema,
                table: tableName,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression
            })

            upQueries.push(new TableQuery(tableName, insertQuery));
            downQueries.push(new TableQuery(tableName, deleteQuery));
        }

        await this.executeQueries(upQueries, downQueries);

        clonedTable.removeColumn(column);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Updates composite primary keys.
     */
    async updatePrimaryKeys(tableOrName: Table | string, columns: TableColumn[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const columnNames = columns.map(column => column.name);
        const upQueries: TableQuery[] = [];
        const downQueries: TableQuery[] = [];

        // if table already have primary columns, we must drop them.
        const primaryColumns = clonedTable.primaryColumns;
        if (primaryColumns.length > 0) {
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, primaryColumns.map(column => column.name));
            const columnNamesString = primaryColumns.map(column => `"${column.name}"`).join(", ");
            upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                DROP CONSTRAINT "${pkName}"`)));
            downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
                ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`)));
        }

        // update columns in table.
        clonedTable.columns
            .filter(column => columnNames.indexOf(column.name) !== -1)
            .forEach(column => column.isPrimary = true);

        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        upQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
            ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`)));
        downQueries.push(new TableQuery(table.name, new Query(`ALTER TABLE ${this.escapePath(table)}
            DROP CONSTRAINT "${pkName}"`)));

        await this.executeQueries(upQueries, downQueries);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Creates new unique constraint.
     */
    async createUniqueConstraint(tableOrName: Table | string, uniqueConstraint: TableUnique): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new unique constraint may be passed without name. In this case we generate unique name manually.
        if (!uniqueConstraint.name)
            uniqueConstraint.name = this.connection.namingStrategy.uniqueConstraintName(table, uniqueConstraint.columnNames);

        const up = this.createUniqueConstraintSql(table, uniqueConstraint);
        const down = this.dropUniqueConstraintSql(table, uniqueConstraint);
        await this.executeQueries(new TableQuery(table.name, up), new TableQuery(table.name, down));
        table.addUniqueConstraint(uniqueConstraint);
    }

    /**
     * Drops unique constraint.
     */
    async dropUniqueConstraint(tableOrName: Table | string, uniqueOrName: TableUnique | string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const uniqueConstraint = uniqueOrName instanceof TableUnique ? uniqueOrName : table.uniques.find(u => u.name === uniqueOrName);
        if (!uniqueConstraint)
            throw new TypeORMError(`Supplied unique constraint was not found in table ${table.name}`);

        const up = this.dropUniqueConstraintSql(table, uniqueConstraint);
        const down = this.createUniqueConstraintSql(table, uniqueConstraint);
        await this.executeQueries(new TableQuery(table.name, up), new TableQuery(table.name, down));
        table.removeUniqueConstraint(uniqueConstraint);
    }

    /**
     * Creates new check constraint.
     */
    async createCheckConstraint(tableOrName: Table | string, checkConstraint: TableCheck): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new unique constraint may be passed without name. In this case we generate unique name manually.
        if (!checkConstraint.name)
            checkConstraint.name = this.connection.namingStrategy.checkConstraintName(table, checkConstraint.expression!);

        const up = this.createCheckConstraintSql(table, checkConstraint);
        const down = this.dropCheckConstraintSql(table, checkConstraint);
        await this.executeQueries(new TableQuery(table.name, up), new TableQuery(table.name, down));
        table.addCheckConstraint(checkConstraint);
    }

    /**
     * Drops check constraint.
     */
    async dropCheckConstraint(tableOrName: Table | string, checkOrName: TableCheck | string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const checkConstraint = checkOrName instanceof TableCheck ? checkOrName : table.checks.find(c => c.name === checkOrName);
        if (!checkConstraint)
            throw new TypeORMError(`Supplied check constraint was not found in table ${table.name}`);

        const up = this.dropCheckConstraintSql(table, checkConstraint);
        const down = this.createCheckConstraintSql(table, checkConstraint);
        await this.executeQueries(new TableQuery(table.name, up), new TableQuery(table.name, down));
        table.removeCheckConstraint(checkConstraint);
    }

    /**
     * Creates new exclusion constraint.
     */
    async createExclusionConstraint(tableOrName: Table | string, exclusionConstraint: TableExclusion): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new unique constraint may be passed without name. In this case we generate unique name manually.
        if (!exclusionConstraint.name)
            exclusionConstraint.name = this.connection.namingStrategy.exclusionConstraintName(table, exclusionConstraint.expression!);

        const up = this.createExclusionConstraintSql(table, exclusionConstraint);
        const down = this.dropExclusionConstraintSql(table, exclusionConstraint);
        await this.executeQueries(new TableQuery(table.name, up), new TableQuery(table.name, down));
        table.addExclusionConstraint(exclusionConstraint);
    }

    /**
     * Drops exclusion constraint.
     */
    async dropExclusionConstraint(tableOrName: Table | string, exclusionOrName: TableExclusion | string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const exclusionConstraint = exclusionOrName instanceof TableExclusion ? exclusionOrName : table.exclusions.find(c => c.name === exclusionOrName);
        if (!exclusionConstraint)
            throw new TypeORMError(`Supplied exclusion constraint was not found in table ${table.name}`);

        const up = this.dropExclusionConstraintSql(table, exclusionConstraint);
        const down = this.createExclusionConstraintSql(table, exclusionConstraint);
        await this.executeQueries(new TableQuery(table.name, up), new TableQuery(table.name, down));
        table.removeExclusionConstraint(exclusionConstraint);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableOrName: Table | string, foreignKey: TableForeignKey): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new FK may be passed without name. In this case we generate FK name manually.
        if (!foreignKey.name)
            foreignKey.name = this.connection.namingStrategy.foreignKeyName(table, foreignKey.columnNames, this.getTablePath(foreignKey), foreignKey.referencedColumnNames);

        const up = this.createForeignKeySql(table, foreignKey);
        const down = this.dropForeignKeySql(table, foreignKey);
        await this.executeQueries(new TableQuery(table.name, up), new TableQuery(table.name, down));
        table.addForeignKey(foreignKey);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableOrName: Table | string, foreignKeyOrName: TableForeignKey | string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
        if (!foreignKey)
            throw new TypeORMError(`Supplied foreign key was not found in table ${table.name}`);

        const up = this.dropForeignKeySql(table, foreignKey);
        const down = this.createForeignKeySql(table, foreignKey);
        await this.executeQueries(new TableQuery(table.name, up), new TableQuery(table.name, down));
        table.removeForeignKey(foreignKey);
    }

    /**
     * Creates a new index.
     */
    async createIndex(tableOrName: Table | string, index: TableIndex): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new index may be passed without name. In this case we generate index name manually.
        if (!index.name)
            index.name = this.connection.namingStrategy.indexName(table, index.columnNames, index.where);

        const up = this.createIndexSql(table, index);
        const down = this.dropIndexSql(table, index);
        await this.executeQueries(new TableQuery(table.name, up), new TableQuery(table.name, down));
        table.addIndex(index);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableOrName: Table | string, indexOrName: TableIndex | string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
        if (!index)
            throw new TypeORMError(`Supplied index was not found in table ${table.name}`);

        const up = this.dropIndexSql(table, index);
        const down = this.createIndexSql(table, index);
        await this.executeQueries(new TableQuery(table.name, up), new TableQuery(table.name, down));
        table.removeIndex(index);
    }


    /**
     * Executes sql used special for schema build.
     */
    protected async executeQueries(upQueries: TableQuery | TableQuery[] | Query | Query[], downQueries: TableQuery | TableQuery[] | Query | Query[]): Promise<void> {
        const resultUpQueries = upQueries instanceof Query || upQueries instanceof TableQuery
            ? [upQueries]
            : upQueries;
        const resultDownQueries = downQueries instanceof Query || downQueries instanceof TableQuery
            ? [downQueries]
            : downQueries;

        this.sqlInMemory.upTableQueries = [
            ...this.sqlInMemory.upTableQueries,
            ...resultUpQueries
                .filter(item => item instanceof TableQuery)
                .map((item: TableQuery) => {
                    const {tableName} = this.driver.parseTableName(item.tableName);
                    item.tableName = tableName;
                    return item;
                }) as TableQuery[]
        ];

        this.sqlInMemory.downTableQueries = [
            ...this.sqlInMemory.downTableQueries,
            ...resultDownQueries
                .filter(item => item instanceof TableQuery)
                .map((item: TableQuery) => {
                    const {tableName} = this.driver.parseTableName(item.tableName);
                    item.tableName = tableName;
                    return item;
                }) as TableQuery[]
        ];

        const originalUpQueries = resultUpQueries.map(item => item instanceof TableQuery ? item.query : item);
        this.sqlInMemory.upQueries.push(...originalUpQueries);
        this.sqlInMemory.downQueries.push(...(resultDownQueries.map(item => item instanceof TableQuery ? item.query : item)));

        // if sql-in-memory mode is enabled then simply store sql in memory and return
        if (this.sqlMemoryMode === true) {
            return Promise.resolve() as Promise<any>;
        }

        for (const {query, parameters} of originalUpQueries) {
            await this.query(query, parameters);
        }
    }

    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory(): void {
        this.sqlInMemory = new TableSqlInMemory();
        this.sqlMemoryMode = true;
    }

    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory(): void {
        this.sqlInMemory = new TableSqlInMemory();
        this.sqlMemoryMode = false;
    }

    /**
     * Flushes all memorized sqls.
     */
    clearSqlMemory(): void {
        this.sqlInMemory = new TableSqlInMemory();
    }

    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql(): TableSqlInMemory {
        return this.sqlInMemory;
    }

}
