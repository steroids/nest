import {describe, expect, it} from '@jest/globals';
import {Query} from 'typeorm/driver/Query';
import {TableQuery} from './CustomPostgresQueryRunner';
import {
    collectMigrationGroups,
    planMigrationFiles,
} from './MigrationPlanner';

const objectFiles = {
    metrics: {
        className: 'MetricTable',
        sourcePath: '/project/src/metric/infrastructure/tables/MetricTable.ts',
    },
    users: {
        className: 'UserTable',
        sourcePath: '/project/src/user/infrastructure/tables/UserTable.ts',
    },
    metric_view: {
        className: 'MetricView',
        sourcePath: '/project/src/metric/infrastructure/tables/MetricView.ts',
    },
};

describe('MigrationPlanner', () => {
    it('keeps views separate and maps junction tables to their owner', () => {
        const groups = collectMigrationGroups({
            upTableQueries: [
                new TableQuery('metrics_tags', new Query('CREATE TABLE metrics_tags'), true),
                new TableQuery('metric_view', new Query('CREATE VIEW metric_view'), true, 'view'),
            ],
            downTableQueries: [],
        } as any, {
            metrics_tags: 'metrics',
        });

        expect(groups).toEqual([
            expect.objectContaining({
                objectName: 'metrics',
                objectType: 'table',
            }),
            expect.objectContaining({
                objectName: 'metric_view',
                objectType: 'view',
            }),
        ]);
    });

    it('plans declarations first with globally unique timestamps', () => {
        const groups = collectMigrationGroups({
            upTableQueries: [
                new TableQuery('metrics', new Query('CREATE TABLE metrics'), true),
                new TableQuery('users', new Query('CREATE TABLE users'), true),
                new TableQuery('metrics', new Query('ALTER TABLE metrics ADD value integer')),
            ],
            downTableQueries: [
                new TableQuery('metrics', new Query('DROP TABLE metrics'), true),
                new TableQuery('users', new Query('DROP TABLE users'), true),
                new TableQuery('metrics', new Query('ALTER TABLE metrics DROP value')),
            ],
        } as any, {});

        const plans = planMigrationFiles(groups, objectFiles, {
            startTimestamp: 100,
            fileExists: () => false,
            resolveMigrationsDir: file => `${file.sourcePath}/../../migrations`,
        });

        expect(plans.map(plan => [plan.phase, plan.timestamp])).toEqual([
            ['declaration', 100],
            ['declaration', 101],
            ['change', 102],
        ]);
        expect(new Set(plans.map(plan => plan.timestamp)).size).toBe(plans.length);
    });

    it('moves the complete timestamp range when any planned file exists', () => {
        const groups = collectMigrationGroups({
            upTableQueries: [
                new TableQuery('metrics', new Query('CREATE TABLE metrics'), true),
                new TableQuery('metrics', new Query('ALTER TABLE metrics ADD value integer')),
            ],
            downTableQueries: [],
        } as any, {});

        const plans = planMigrationFiles(groups, objectFiles, {
            startTimestamp: 100,
            fileExists: filePath => filePath.includes('100-MetricTable.ts'),
            resolveMigrationsDir: () => '/migrations',
        });

        expect(plans.map(plan => plan.timestamp)).toEqual([102, 103]);
    });

    it('reverses down queries within a migration file', () => {
        const groups = collectMigrationGroups({
            upTableQueries: [],
            downTableQueries: [
                new TableQuery('metrics', new Query('DOWN FIRST')),
                new TableQuery('metrics', new Query('DOWN SECOND')),
            ],
        } as any, {});

        const [plan] = planMigrationFiles(groups, objectFiles, {
            startTimestamp: 100,
            fileExists: () => false,
            resolveMigrationsDir: () => '/migrations',
        });

        expect(plan.content.indexOf('DOWN SECOND')).toBeLessThan(plan.content.indexOf('DOWN FIRST'));
    });

    it('rejects unresolved schema objects before producing a plan', () => {
        const groups = collectMigrationGroups({
            upTableQueries: [
                new TableQuery('unknown', new Query('CREATE TABLE unknown'), true),
            ],
            downTableQueries: [],
        } as any, {});

        expect(() => planMigrationFiles(groups, objectFiles, {
            startTimestamp: 100,
            fileExists: () => false,
            resolveMigrationsDir: () => '/migrations',
        })).toThrow('Cannot resolve source files for schema objects: unknown');
    });
});
