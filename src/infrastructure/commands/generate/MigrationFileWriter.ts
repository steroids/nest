import {mkdir, unlink, writeFile} from 'fs/promises';
import {dirname} from 'path';
import {MigrationFilePlan} from './MigrationPlanner';

/**
 * Записывает подготовленные миграции без перезаписи существующих файлов.
 */
export const writeMigrationFiles = async (plans: MigrationFilePlan[]): Promise<string[]> => {
    const writtenFiles: string[] = [];

    try {
        for (const plan of plans) {
            await mkdir(dirname(plan.filePath), {recursive: true});
            await writeFile(plan.filePath, plan.content, {flag: 'wx'});
            writtenFiles.push(plan.filePath);
        }
    } catch (error) {
        for (const filePath of writtenFiles) {
            try {
                await unlink(filePath);
            } catch {
                // Сохраняем исходную ошибку записи, не заменяя её ошибкой очистки.
            }
        }
        throw error;
    }

    return writtenFiles;
};
