import {Command, Positional} from 'nestjs-command';
import {Inject, Injectable} from '@nestjs/common';
import {dbml2code} from './dbml/dbml2code';
import {generate} from './generate';
import {DataSource, getFromContainer, MigrationInterface} from 'typeorm';
import {ConnectionMetadataBuilder} from 'typeorm/connection/ConnectionMetadataBuilder';
import {OrmUtils} from 'typeorm/util/OrmUtils';
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
        command: 'migrate:revert',
        describe: 'Revert last migration',
    })
    async redo() {
        await this.dataSource.undoLastMigration({
            transaction: 'each',
        });
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
    async generate() {
        await generate(this.dataSource);
    }

}
