import {existsSync} from 'fs';
import {resolve} from 'path';
import {DataSource} from 'typeorm';
import {MigrationExecutor} from 'typeorm/migration/MigrationExecutor';
import {CustomRdbmsSchemaBuilder} from './CustomRdbmsSchemaBuilder';
import {
    resolveSchemaObjectFiles,
    SchemaObjectFile,
    SchemaObjectFiles,
} from './EntityFileResolver';
import {writeMigrationFiles} from './MigrationFileWriter';
import {
    buildJunctionTableMap,
    collectMigrationGroups,
    MigrationFilePlan,
    planMigrationFiles,
} from './MigrationPlanner';

export {getTemplate, prettifyQuery} from './MigrationRenderer';

/** Минимальный интерфейс вывода сообщений генератора. */
export type MigrationGeneratorLogger = {
    info: (message: string) => void,
    error: (message: string) => void,
};

/** Настройки и подменяемые зависимости генератора миграций. */
export type MigrationGeneratorOptions = {
    now?: () => number,
    fileExists?: (filePath: string) => boolean,
    logger?: MigrationGeneratorLogger,
    resolveMigrationsDir?: (objectFile: SchemaObjectFile) => string,
    resolveObjectFiles?: (dataSource: DataSource) => Promise<SchemaObjectFiles>,
    writeFiles?: (plans: MigrationFilePlan[]) => Promise<string[]>,
    hasPendingMigrations?: (dataSource: DataSource) => Promise<boolean>,
};

/** Результат выполнения команды без необходимости разбирать console output. */
export type MigrationGenerationResult = {
    status: 'generated' | 'no-changes',
    files: string[],
};

const defaultLogger: MigrationGeneratorLogger = {
    // eslint-disable-next-line no-console
    info: message => console.info(message),
    // eslint-disable-next-line no-console
    error: message => console.error(message),
};

/**
 * Тихо проверяет наличие неприменённых миграций без вывода полного списка.
 */
export const hasPendingMigrations = async (dataSource: DataSource): Promise<boolean> => {
    const migrationExecutor = new MigrationExecutor(dataSource);
    return (await migrationExecutor.getPendingMigrations()).length > 0;
};

/**
 * Координирует получение schema diff, планирование и запись файлов миграций.
 */
export const generate = async (
    dataSource: DataSource,
    options: MigrationGeneratorOptions = {},
): Promise<MigrationGenerationResult> => {
    if (await (options.hasPendingMigrations || hasPendingMigrations)(dataSource)) {
        const message = 'Unapplied migrations detected. Database schema is out of sync.';
        (options.logger || defaultLogger).error(message);
        throw new Error(message);
    }

    const logger = options.logger || defaultLogger;
    const sqlInMemory = await new CustomRdbmsSchemaBuilder(dataSource).log();
    const groups = collectMigrationGroups(sqlInMemory, buildJunctionTableMap(dataSource));

    if (groups.length === 0) {
        logger.info('No changes in database schema were found');
        return {status: 'no-changes',
            files: []};
    }

    const objectFiles = await (options.resolveObjectFiles || resolveSchemaObjectFiles)(dataSource);
    const plans = planMigrationFiles(groups, objectFiles, {
        startTimestamp: (options.now || Date.now)(),
        fileExists: options.fileExists || existsSync,
        resolveMigrationsDir: options.resolveMigrationsDir
            || (objectFile => resolve(objectFile.sourcePath, '../../migrations')),
    });
    const files = await (options.writeFiles || writeMigrationFiles)(plans);

    logger.info(`Created migrations:\n${files.map(filePath => `\t${filePath}`).join('\n')}`);
    return {status: 'generated',
        files};
};
