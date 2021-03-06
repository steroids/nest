import * as path from 'path';
import * as fs from 'fs';

export class ModuleHelper {
    static importDir(dir, custom = {}) {
        dir = path.normalize(dir);

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

    static provide(Type, inject: any[]) {
        return {
            inject: inject.reduce((arr, item) => arr.concat(item), []),
            provide: Type,
            useFactory: (...args) => {
                const instances = [];
                let injectIndex = 0;
                let argsIndex = 0;
                inject.forEach(() => {
                    if (Array.isArray(inject[injectIndex])) {
                        instances.push(inject[injectIndex++].map(() => args[argsIndex++]));
                    } else {
                        instances.push(args[argsIndex++]);
                        injectIndex++;
                    }
                });

                return new Type(...instances)
            },
        };
    }
}
