import * as path from 'path';
import * as fs from 'fs';

export class PermissionsFactory {
    static _permissions = {};

    static add(permissions) {
        this._permissions = {
            ...this._permissions,
            ...permissions,
        };
    }

    static getAllPermissionsKeys() {

        const walk = (items) => {
            let keys = [];
            (items || []).forEach(item => {
                keys = keys.concat(item.id)
                    .concat(walk(item.items));
            });
            return keys;
        };
        return walk(this._permissions);
    }
}
