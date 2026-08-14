import {Command, Positional} from 'nestjs-command';
import {Inject, Injectable} from '@nestjs/common';
import {DataSource, MigrationInterface} from 'typeorm';
import {OrmUtils} from 'typeorm/util/OrmUtils';
import {ConnectionMetadataBuilder} from 'typeorm/connection/ConnectionMetadataBuilder';
import {dbml2code} from './dbml/dbml2code';
import {generate} from './generate';
import {importClassesFromDirectories} from './importClassesFromDirectories';

// eslint-disable-next-line @typescript-eslint/ban-types
ConnectionMetadataBuilder.prototype.buildMigrations = async (migrations: (Function|string)[]): Promise<MigrationInterface[]> => {
    const [migrationClasses, migrationDirectories] = OrmUtils.splitClassesAndStrings(migrations);
    const allMigrationClasses = [
        ...migrationClasses,
        // @ts-ignore
        ...(await importClassesFromDirectories((this as ConnectionMetadataBuilder).dataSource.logger, migrationDirectories)),
    ];
    return allMigrationClasses.map(migrationClass => new (migrationClass as new () => MigrationInterface)());
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
    async generate() {
        await generate(this.dataSource);
    }
}
