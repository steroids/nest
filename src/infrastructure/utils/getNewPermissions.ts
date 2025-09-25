import {Connection} from '@steroidsjs/typeorm';
import {PermissionsFactory} from '../helpers/PermissionsFactory';

export const getNewPermissions = async (connection: Connection, tableName = 'auth_permission', columnName = 'name') => {
    const allPermissions = PermissionsFactory.getAllPermissionsKeys();

    if (allPermissions.length === 0) {
        return allPermissions;
    }

    const existingPermissions = new Set<string>();
    const existingPermissionsRows: Array<{ [column: string]: string }> = await connection.query(
        `SELECT ${columnName} FROM ${tableName}`,
    );
    for (const row of existingPermissionsRows) {
        existingPermissions.add(row[columnName]);
    }

    return allPermissions.filter(permission => !existingPermissions.has(permission));
};
