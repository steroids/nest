import {afterEach, describe, expect, it} from '@jest/globals';
import {existsSync} from 'fs';
import {mkdtemp, readFile, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join} from 'path';
import {writeMigrationFiles} from './MigrationFileWriter';
import {MigrationFilePlan} from './MigrationPlanner';

const temporaryDirectories: string[] = [];

const createPlan = (filePath: string, content = 'migration'): MigrationFilePlan => ({
    objectName: 'metrics',
    objectType: 'table',
    phase: 'change',
    timestamp: 100,
    filePath,
    content,
});

describe('MigrationFileWriter', () => {
    afterEach(async () => {
        for (const directory of temporaryDirectories.splice(0)) {
            await rm(directory, {recursive: true,
                force: true});
        }
    });

    it('writes planned files without overwriting existing files', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'steroids-migrations-'));
        temporaryDirectories.push(directory);
        const filePath = join(directory, 'nested', '100-MetricTable.ts');

        const files = await writeMigrationFiles([createPlan(filePath)]);

        expect(files).toEqual([filePath]);
        expect(await readFile(filePath, 'utf8')).toBe('migration');
        await expect(writeMigrationFiles([createPlan(filePath, 'overwritten')]))
            .rejects.toMatchObject({code: 'EEXIST'});
        expect(await readFile(filePath, 'utf8')).toBe('migration');
    });

    it('removes files created by the current run when a later write fails', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'steroids-migrations-'));
        temporaryDirectories.push(directory);
        const filePath = join(directory, '100-MetricTable.ts');

        await expect(writeMigrationFiles([
            createPlan(filePath),
            createPlan(filePath),
        ])).rejects.toMatchObject({code: 'EEXIST'});

        expect(existsSync(filePath)).toBe(false);
    });
});
