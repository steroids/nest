import {loadConfiguration} from '@nestjs/cli/lib/utils/load-configuration';
import {readdir} from 'fs/promises';
import {basename, extname, join, normalize, sep} from 'path';
import {glob} from 'glob';
import {DataSource} from 'typeorm';
import {ModuleHelper} from '../../helpers/ModuleHelper';

/** Исходный файл entity и имя класса для генерируемой миграции. */
export type SchemaObjectFile = {
    className: string,
    sourcePath: string,
};

/** Файлы entity, индексированные по имени таблицы или view. */
export type SchemaObjectFiles = Record<string, SchemaObjectFile>;

type ModuleCacheEntry = [string, {exports: unknown} | undefined];

/** Подменяемые данные resolver для изолированной проверки поиска загруженных entity. */
export type EntityFileResolverOptions = {
    moduleCache?: ModuleCacheEntry[],
};

/** Проверяет, что найденный файл принадлежит установленной зависимости. */
const isDependencyFilePath = (sourcePath: string): boolean => normalize(sourcePath)
    .split(sep)
    .includes('node_modules');

/**
 * Локальная регистрация entity имеет приоритет над её физическим файлом в npm-пакете.
 */
const shouldUseLocalFile = (
    files: SchemaObjectFiles,
    tableName: string,
): boolean => !files[tableName] || isDependencyFilePath(files[tableName].sourcePath);

/**
 * Проверяет прямые экспорты модуля, не вызывая getters вроде yargs.argv.
 */
const moduleExportsEntity = (moduleExports: unknown, entityClass: unknown): boolean => {
    if (moduleExports === entityClass) {
        return true;
    }
    if (!moduleExports || !['object', 'function'].includes(typeof moduleExports)) {
        return false;
    }

    return Object.values(Object.getOwnPropertyDescriptors(moduleExports))
        .some(descriptor => 'value' in descriptor && descriptor.value === entityClass);
};

/**
 * Ищет файл, который экспортирует entity-класс, предпочитая файл с совпадающим именем.
 */
const findEntityFilePath = (
    entityClass: unknown,
    className: string,
    moduleCache: ModuleCacheEntry[],
): string | undefined => {
    const candidates = moduleCache
        .filter(([, module]) => moduleExportsEntity(module?.exports, entityClass))
        .map(([filePath]) => filePath);

    return candidates.find(filePath => basename(filePath, extname(filePath)) === className)
        || candidates[0];
};

const resolveFromModuleCache = (
    dataSource: DataSource,
    moduleCache: ModuleCacheEntry[] = Object.entries(require.cache),
): SchemaObjectFiles => {
    const files: SchemaObjectFiles = {};

    for (const metadata of dataSource.entityMetadatas) {
        if (typeof metadata.target === 'function') {
            const sourcePath = findEntityFilePath(metadata.target, metadata.targetName, moduleCache);
            if (sourcePath) {
                files[metadata.tableName] = {
                    className: metadata.targetName,
                    sourcePath,
                };
            }
        }
    }

    return files;
};

/**
 * Дополняет результат поиском по стандартной структуре Steroids-проекта.
 */
const resolveFromSteroidsLayout = async (
    dataSource: DataSource,
    files: SchemaObjectFiles,
): Promise<void> => {
    const configuration = await loadConfiguration();
    const sourceRoot = join(process.cwd(), configuration.sourceRoot);
    const tableNameByClass = dataSource.entityMetadatas.reduce<Record<string, string>>((result, metadata) => {
        result[metadata.targetName] = metadata.tableName;
        return result;
    }, {});

    const directoryEntries = await readdir(sourceRoot, {withFileTypes: true});
    for (const directoryEntry of directoryEntries) {
        if (directoryEntry.isDirectory()) {
            const moduleName = directoryEntry.name;
            const tablePaths = await glob(join(sourceRoot, moduleName, '**/tables/*Table{.ts,.js}'));
            for (const sourcePath of tablePaths) {
                const className = basename(sourcePath).replace(/\.(?:ts|js)$/, '');
                const tableName = tableNameByClass[className];
                if (tableName && shouldUseLocalFile(files, tableName)) {
                    files[tableName] = {className,
                        sourcePath};
                }
            }

            for (const entity of ModuleHelper.getEntities(moduleName)) {
                const className = entity.name;
                const tableName = tableNameByClass[className];
                if (tableName && shouldUseLocalFile(files, tableName)) {
                    files[tableName] = {
                        className,
                        sourcePath: join(
                            sourceRoot,
                            moduleName,
                            'infrastructure',
                            'tables',
                            className + '.ts',
                        ),
                    };
                }
            }
        }
    }
};

/**
 * Сопоставляет имена объектов схемы с исходными файлами их entity-классов.
 */
export const resolveSchemaObjectFiles = async (
    dataSource: DataSource,
    options: EntityFileResolverOptions = {},
): Promise<SchemaObjectFiles> => {
    const files = resolveFromModuleCache(dataSource, options.moduleCache);
    const hasNonLocalEntities = dataSource.entityMetadatas.some(metadata => {
        const objectFile = files[metadata.tableName];
        return !objectFile || isDependencyFilePath(objectFile.sourcePath);
    });

    if (hasNonLocalEntities) {
        // Обход также определяет локальный модуль для entity, экспортированных npm-пакетами.
        await resolveFromSteroidsLayout(dataSource, files);
    }

    return files;
};
