import {DataSource} from '@steroidsjs/typeorm';
import {PermissionsFactory} from '../helpers/PermissionsFactory';

export const getNewPermissions = async (dataSource: DataSource, table?: string, column?: string) => {
    const allPermissions = PermissionsFactory.getAllPermissionsKeys();

    if (allPermissions.length === 0) {
        return allPermissions;
    }

    const defaultConfig = PermissionsFactory.getDefaultPermissionsConfig();

    const finalTable = table || defaultConfig.table;
    const finalColumn = column || defaultConfig.column;

    const existingPermissions = new Set<string>();
    const existingPermissionsRows: Array<{ [column: string]: string }> = await dataSource.query(
        `SELECT ${finalColumn} FROM ${finalTable}`,
    );
    for (const row of existingPermissionsRows) {
        existingPermissions.add(row[finalColumn]);
    }

    return allPermissions.filter(permission => !existingPermissions.has(permission));
};
