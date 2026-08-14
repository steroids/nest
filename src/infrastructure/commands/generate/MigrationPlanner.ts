import {join} from 'path';
import {DataSource} from 'typeorm';
import {Query} from 'typeorm/driver/Query';
import {SchemaObjectFile, SchemaObjectFiles} from './EntityFileResolver';
import {
    SchemaObjectType,
    TableQuery,
    TableSqlInMemory,
} from './CustomPostgresQueryRunner';
import {getTemplate} from './MigrationRenderer';

/** Фаза нужна для гарантированного создания объектов до ключей и индексов. */
export type MigrationPhase = 'declaration' | 'change';

/**
 * Все изменения одного объекта схемы, разделённые по направлению и фазе.
 */
export type MigrationGroup = {
    objectName: string,
    objectType: SchemaObjectType,
    declarationUp: Query[],
    declarationDown: Query[],
    changesUp: Query[],
    changesDown: Query[],
};

/**
 * Полностью подготовленный файл миграции, готовый к записи.
 */
export type MigrationFilePlan = {
    objectName: string,
    objectType: SchemaObjectType,
    phase: MigrationPhase,
    timestamp: number,
    filePath: string,
    content: string,
};

/** Внешние зависимости планировщика для путей, времени и проверки коллизий. */
export type MigrationPlannerOptions = {
    startTimestamp: number,
    fileExists: (filePath: string) => boolean,
    resolveMigrationsDir: (objectFile: SchemaObjectFile) => string,
};

type MigrationCandidate = {
    group: MigrationGroup,
    phase: MigrationPhase,
    upQueries: Query[],
    downQueries: Query[],
};

/**
 * Сопоставляет junction-таблицы Many-to-Many с entity, которой принадлежит миграция.
 */
export const buildJunctionTableMap = (dataSource: DataSource): Record<string, string> => {
    const junctionTables: Record<string, string> = {};

    for (const metadata of dataSource.entityMetadatas) {
        for (const relation of metadata.manyToManyRelations) {
            if (relation.joinTableName) {
                junctionTables[relation.joinTableName] = metadata.tableName;
            }
        }
    }

    return junctionTables;
};

const createMigrationGroup = (
    objectName: string,
    objectType: SchemaObjectType,
): MigrationGroup => ({
    objectName,
    objectType,
    declarationUp: [],
    declarationDown: [],
    changesUp: [],
    changesDown: [],
});

const getObjectName = (
    query: TableQuery,
    junctionTables: Record<string, string>,
): string => query.objectType === 'table'
    ? junctionTables[query.tableName] || query.tableName
    : query.tableName;

/**
 * Группирует записанные SQL-запросы по таблицам/views и фазам миграции.
 */
export const collectMigrationGroups = (
    sqlInMemory: TableSqlInMemory,
    junctionTables: Record<string, string>,
): MigrationGroup[] => {
    const groups = new Map<string, MigrationGroup>();

    const addQuery = (trackedQuery: TableQuery, direction: 'up' | 'down'): void => {
        const objectName = getObjectName(trackedQuery, junctionTables);
        const key = `${trackedQuery.objectType}:${objectName}`;
        const group = groups.get(key)
            || createMigrationGroup(objectName, trackedQuery.objectType);
        groups.set(key, group);

        if (trackedQuery.isTableDeclaration) {
            group[direction === 'up' ? 'declarationUp' : 'declarationDown'].push(trackedQuery.query);
        } else {
            group[direction === 'up' ? 'changesUp' : 'changesDown'].push(trackedQuery.query);
        }
    };

    sqlInMemory.upTableQueries.forEach(query => addQuery(query, 'up'));
    sqlInMemory.downTableQueries.forEach(query => addQuery(query, 'down'));

    return [...groups.values()];
};

const getCandidates = (groups: MigrationGroup[]): MigrationCandidate[] => {
    // Сначала создаются все таблицы/views, затем индексы, ключи и остальные изменения.
    const declarations = groups
        .filter(group => group.declarationUp.length > 0 || group.declarationDown.length > 0)
        .map(group => ({
            group,
            phase: 'declaration' as const,
            upQueries: group.declarationUp,
            // Откат операций внутри одного файла должен идти в обратном порядке.
            downQueries: [...group.declarationDown].reverse(),
        }));
    const changes = groups
        .filter(group => group.changesUp.length > 0 || group.changesDown.length > 0)
        .map(group => ({
            group,
            phase: 'change' as const,
            upQueries: group.changesUp,
            downQueries: [...group.changesDown].reverse(),
        }));

    return [...declarations, ...changes];
};

const assertAllObjectFilesResolved = (
    candidates: MigrationCandidate[],
    objectFiles: SchemaObjectFiles,
): void => {
    const missingObjects = [...new Set(candidates
        .map(candidate => candidate.group.objectName)
        .filter(objectName => !objectFiles[objectName]))];

    if (missingObjects.length > 0) {
        throw new Error(`Cannot resolve source files for schema objects: ${missingObjects.join(', ')}`);
    }
};

/**
 * Назначает кандидатам timestamps и формирует содержимое будущих файлов.
 */
const buildPlans = (
    candidates: MigrationCandidate[],
    objectFiles: SchemaObjectFiles,
    startTimestamp: number,
    resolveMigrationsDir: MigrationPlannerOptions['resolveMigrationsDir'],
): MigrationFilePlan[] => candidates.map((candidate, index) => {
    const timestamp = startTimestamp + index;
    const objectFile = objectFiles[candidate.group.objectName];
    const fileName = `${timestamp}-${objectFile.className}.ts`;
    const filePath = join(resolveMigrationsDir(objectFile), fileName);

    return {
        objectName: candidate.group.objectName,
        objectType: candidate.group.objectType,
        phase: candidate.phase,
        timestamp,
        filePath,
        content: getTemplate(
            objectFile.className,
            timestamp,
            candidate.upQueries,
            candidate.downQueries,
        ),
    };
});

/**
 * Валидирует изменения и строит план файлов с уникальным диапазоном timestamps.
 */
export const planMigrationFiles = (
    groups: MigrationGroup[],
    objectFiles: SchemaObjectFiles,
    options: MigrationPlannerOptions,
): MigrationFilePlan[] => {
    const candidates = getCandidates(groups);
    assertAllObjectFilesResolved(candidates, objectFiles);

    let timestamp = options.startTimestamp;
    let plans = buildPlans(candidates, objectFiles, timestamp, options.resolveMigrationsDir);
    while (plans.some(plan => options.fileExists(plan.filePath))) {
        // Сдвигаем весь диапазон, чтобы сохранить относительный порядок миграций.
        timestamp += Math.max(plans.length, 1);
        plans = buildPlans(candidates, objectFiles, timestamp, options.resolveMigrationsDir);
    }

    return plans;
};
