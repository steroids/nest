import {Command, Option, Positional} from 'nestjs-command';
import {Inject, Injectable} from '@nestjs/common';
import {dbml2code} from './dbml/dbml2code';
import {generate} from './generate';
import {DataSource, getFromContainer, MigrationInterface} from '@steroidsjs/typeorm';
import {ConnectionMetadataBuilder} from '@steroidsjs/typeorm/connection/ConnectionMetadataBuilder';
import {OrmUtils} from '@steroidsjs/typeorm/util/OrmUtils';
import {importClassesFromDirectories} from './importClassesFromDirectories';

ConnectionMetadataBuilder.prototype.buildMigrations = async function (migrations: (Function|string)[]): Promise<MigrationInterface[]> {
    const [migrationClasses, migrationDirectories] = OrmUtils.splitClassesAndStrings(migrations);
    const allMigrationClasses = [...migrationClasses, ...(await importClassesFromDirectories(this.connection.logger, migrationDirectories))];
    return allMigrationClasses.map(migrationClass => getFromContainer<MigrationInterface>(migrationClass));
}

@Injectable()
export class MigrateCommand {
    constructor(
        @Inject(DataSource)
        private dataSource: DataSource,
    ) {
    }

    @Command({
        command: 'migrate',
        describe: 'Run migrations',
    })
    async index() {
        await this.dataSource.runMigrations({
            transaction: 'each',
        });
        process.exit();
    }

    @Command({
        command: 'migrate:revert [count]',
        describe: 'Revert last migration',
    })
    async revert(
        @Positional({
            name: 'count',
            describe: 'Number of migrations to revert',
            type: 'number',
            default: 1,
        })
        count: number,
    ) {
        for (let i = 0; i < count; i+= 1) {
            await this.dataSource.undoLastMigration({
                transaction: 'each',
            });
        }
    }

    @Command({
        command: 'migrate:show',
        describe: 'Show migrations list',
    })
    async show() {
        await this.dataSource.showMigrations();
    }

    @Command({
        command: 'migrate:dbml2code <path>',
        describe: 'Generate code from dbml diagram',
    })
    async dbml2code(
        @Positional({
            name: 'path',
            // @ts-ignore
            describe: 'Path to *.dbml file',
            type: 'string'
        })
            path: string,
    ) {
        await dbml2code(path);
    }

    @Command({
        command: 'migrate:generate',
        describe: 'Create migrations for each model changes',
    })
    async generate(
        @Option({
            name: 'permissionTable',
            describe: 'Table name for permissions',
            type: 'string',
            default: 'auth_permission',
        })
            permissionTable: string,

        @Option({
            name: 'permissionColumn',
            describe: 'Column name of permission',
            type: 'string',
            default: 'name',
        })
            permissionColumn: string,

        @Option({
            name: 'permissionModule',
            describe: 'Module where write migrations of permissions',
            type: 'string',
            default: 'auth',
        })
            permissionModule: string,
    ) {
        await generate(this.dataSource, {
            table: permissionTable,
            column: permissionColumn,
            module: permissionModule,
        });
    }
}
