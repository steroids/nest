import {Command} from 'nestjs-command';
import {Injectable} from '@nestjs/common';
import {Connection} from 'typeorm';
import {generate} from './generate';

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
        command: 'migrate:generate',
        describe: 'Create migrations for each model changes',
    })
    async generate() {
        await generate(this.connection);
    }

}
