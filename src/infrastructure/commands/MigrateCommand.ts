import {Command, Positional} from 'nestjs-command';
import {Injectable} from '@nestjs/common';
import {Connection} from 'typeorm';
import {dbml2code} from './dbml/dbml2code';
import {generate} from './generate';

interface IMigrationData {
    moduleDir: string,
    modelName: string,
    tableName: string,
    upQueries: string[],
    downQueries: string[]
}

@Injectable()
export class MigrateCommand {
    constructor(
        private connection: Connection,
    ) {
    }

    @Command({
        command: 'migrate',
        describe: 'Run migrations',
    })
    async index() {
        await this.connection.runMigrations({
            transaction: 'each',
        });
    }

    @Command({
        command: 'migrate:revert',
        describe: 'Revert last migration',
    })
    async redo() {
        await this.connection.undoLastMigration({
            transaction: 'each',
        });
    }

    @Command({
        command: 'migrate:show',
        describe: 'Show migrations list',
    })
    async show() {
        await this.connection.showMigrations();
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
        await generate(this.connection);
    }

}
