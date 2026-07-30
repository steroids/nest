import {describe, expect, it, jest} from '@jest/globals';
import {join} from 'path';
import * as nestCliConfiguration from '@nestjs/cli/lib/utils/load-configuration';
import {ModuleHelper} from '../../helpers/ModuleHelper';
import {resolveSchemaObjectFiles} from './EntityFileResolver';

export class EntityWithCustomFileName {
}

describe('EntityFileResolver', () => {
    it('resolves loaded entities without relying on Steroids file naming conventions', async () => {
        const dataSource = {
            entityMetadatas: [{
                target: EntityWithCustomFileName,
                targetName: EntityWithCustomFileName.name,
                tableName: 'custom_entities',
            }],
        };

        const files = await resolveSchemaObjectFiles(dataSource as any);

        expect(files.custom_entities).toEqual({
            className: EntityWithCustomFileName.name,
            sourcePath: expect.stringContaining('EntityFileResolver.test.ts'),
        });
    });

    it('does not invoke getters while inspecting module exports', async () => {
        const getter = jest.fn(() => {
            throw new Error('Export getter must not be called');
        });
        const cacheKey = join(__dirname, 'dangerous-exports.fixture.js');
        const fakeExports = {};
        Object.defineProperty(fakeExports, 'dangerousExport', {
            configurable: true,
            enumerable: true,
            get: getter,
        });
        require.cache[cacheKey] = {exports: fakeExports} as any;

        try {
            await resolveSchemaObjectFiles({
                entityMetadatas: [{
                    target: EntityWithCustomFileName,
                    targetName: EntityWithCustomFileName.name,
                    tableName: 'custom_entities',
                }],
            } as any);
        } finally {
            delete require.cache[cacheKey];
        }

        expect(getter).not.toHaveBeenCalled();
    });

    it('uses the local module for an entity exported by an npm package', async () => {
        const cacheKey = join(
            process.cwd(),
            'node_modules',
            '@example',
            'package',
            `${EntityWithCustomFileName.name}.js`,
        );
        const loadConfigurationSpy = jest
            .spyOn(nestCliConfiguration, 'loadConfiguration')
            .mockResolvedValue({sourceRoot: 'src'} as any);
        const getEntitiesSpy = jest
            .spyOn(ModuleHelper, 'getEntities')
            .mockImplementation((moduleName: string) => moduleName === 'infrastructure'
                ? [EntityWithCustomFileName]
                : []);

        try {
            const files = await resolveSchemaObjectFiles({
                entityMetadatas: [{
                    target: EntityWithCustomFileName,
                    targetName: EntityWithCustomFileName.name,
                    tableName: 'packaged_entities',
                }],
            } as any, {
                moduleCache: [[cacheKey, {
                    exports: {[EntityWithCustomFileName.name]: EntityWithCustomFileName},
                }]],
            });

            expect(files.packaged_entities).toEqual({
                className: EntityWithCustomFileName.name,
                sourcePath: join(
                    process.cwd(),
                    'src',
                    'infrastructure',
                    'infrastructure',
                    'tables',
                    `${EntityWithCustomFileName.name}.ts`,
                ),
            });
        } finally {
            loadConfigurationSpy.mockRestore();
            getEntitiesSpy.mockRestore();
        }
    });
});
