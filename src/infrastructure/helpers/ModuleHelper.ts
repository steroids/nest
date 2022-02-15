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
}
