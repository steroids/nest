import * as glob from "glob";
import {PlatformTools} from "typeorm/platform/PlatformTools";
import {EntitySchema} from "typeorm/entity-schema/EntitySchema";
import {Logger} from "typeorm/logger/Logger";
import {importOrRequireFile} from "typeorm/util/ImportUtils";

class MockMigration {
    name: string;
    file: string;
    _lazyInstance: any;


    async up(queryRunner) {
        await this._load();
        await this._lazyInstance.up(queryRunner);
    }

    async down(queryRunner) {
        await this._load();
        await this._lazyInstance.down(queryRunner);
    }

    async _load() {
        if (!this._lazyInstance) {
            const result: any = await importOrRequireFile(PlatformTools.pathResolve(this.file));
            const MigrationClass = result?.[0]?.[this.name] || result?.[0]?.default || result?.[0];
            this._lazyInstance = new MigrationClass();
        }
    }
}

const createMockMigration = file => {
    const matches = /([0-9]+)-([a-zA-Z0-9]+)+.(ts|js)$/.exec(file);
    const name = matches ? matches[2] + matches[1] : 'MockMigration';

    const NewClass = new Function('return function ' + name + '(){ this.name = "' + name + '"; this.file = "' + file + '" }')();
    NewClass.prototype = Object.create(MockMigration.prototype);

    return NewClass;
}

/**
 * Loads all exported classes from the given directory.
 */
export async function importClassesFromDirectories(logger: Logger, directories: string[], formats = [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]): Promise<Function[]> {

    const logLevel = "info";
    const classesNotFoundMessage = "No classes were found using the provided glob pattern: ";
    const classesFoundMessage = "All classes found using provided glob pattern";
    function loadFileClasses(exported: any, allLoaded: Function[]) {
        if (typeof exported === "function" || exported instanceof EntitySchema) {
            allLoaded.push(exported);

        } else if (Array.isArray(exported)) {
            exported.forEach((i: any) => loadFileClasses(i, allLoaded));

        } else if (typeof exported === "object" && exported !== null) {
            Object.keys(exported).forEach(key => loadFileClasses(exported[key], allLoaded));

        }
        return allLoaded;
    }

    let allFiles: string[] = [];
    await Promise.all(directories.map(dir => {
        return new Promise((resolve, reject) => {
            glob(PlatformTools.pathNormalize(dir), (err, matches) => {
                if (err) {
                    reject(err);
                } else {
                    allFiles = allFiles.concat(matches)
                    resolve(null);
                }
            });
        });
    }));

    if (directories.length > 0 && allFiles.length === 0) {
        logger.log(logLevel, `${classesNotFoundMessage} "${directories}"`);
    } else if (allFiles.length > 0) {
        logger.log(logLevel, `${classesFoundMessage} "${directories}" : "${allFiles}"`);
    }
    const dirs = allFiles
        .filter(file => {
            const dtsExtension = file.substring(file.length - 5, file.length);
            return formats.indexOf(PlatformTools.pathExtname(file)) !== -1 && dtsExtension !== ".d.ts";
        })
        .map(file => createMockMigration(file));

    return loadFileClasses(dirs, []);
}
