import * as path from 'path';
import * as fs from 'fs';
import {Provider} from '@nestjs/common';

type ModuleClass = {
    readonly name: string,
};

export class ModuleHelper {

    private static _allEntities = [];

    private static _moduleEntities = {};

    private static _configs = {};

    private static _initHandlers = [];

    static addEntities(entities, moduleName) {
        this._allEntities.push(...entities);

        if (moduleName) {
            this._moduleEntities[moduleName] = this._moduleEntities[moduleName] || [];
            this._moduleEntities[moduleName].push(...entities);
        }
    }

    static addInitializer(handler) {
        this._initHandlers.push(handler);
    }

    static runInitializers() {
        for (const handler of this._initHandlers) {
            handler();
        }
    }

    static getEntities(moduleName = null) {
        return moduleName
            ? this._moduleEntities[moduleName] || []
            : this._allEntities;
    }

    static setConfig(moduleClass: ModuleClass, config: any) {
        this._configs[moduleClass.name] = config;
    }

    static getConfig<T>(moduleClass: ModuleClass): T {
        if (typeof this._configs[moduleClass.name] === 'function') {
            this._configs[moduleClass.name] = this._configs[moduleClass.name]();
        }
        return this._configs[moduleClass.name] || null;
    }

    static importDir(dir, custom = {}) {
        dir = path.normalize(dir);

        if (!fs.existsSync(dir)) {
            return [];
        }

        return fs.readdirSync(dir)
            .map(fileName => {
                if (!/\.(js|ts)$/.test(fileName) || /\.d\.ts$/.test(fileName)) {
                    return null;
                }

                const name = fileName.replace(/\.(js|ts)$/, '');
                if (custom[name]) {
                    return custom[name];
                }

                const module = require(path.join(dir, fileName));
                return module[name] || module.default;
            })
            .filter(Boolean);
    }

    /** @deprecated */
    static provide(Type, nameOrInject, inject = null): Provider {
        const provide = typeof nameOrInject === 'string' ? nameOrInject : Type;
        inject = Array.isArray(nameOrInject) ? nameOrInject : inject;

        if (!inject || inject.length === 0) {
            return {
                provide,
                useClass: Type,
            };
        }

        return {
            inject: inject.reduce((arr, item) => arr.concat(item), []),
            provide,
            useFactory: (...args) => {
                let argsIndex = 0;

                const instances = inject.map(item => {
                    if (Array.isArray(item)) {
                        const itemInstances = args.slice(argsIndex, argsIndex + item.length);
                        argsIndex += item.length;
                        return itemInstances;
                    }

                    const instance = args[argsIndex];
                    argsIndex += 1;
                    return instance;
                });

                return new Type(...instances);
            },
        };
    }
}
