import {PostgresConnectionOptions} from '@steroidsjs/typeorm/driver/postgres/PostgresConnectionOptions';
import {join} from 'path';
import * as fs from 'node:fs';
import baseConfig from '../base/config';
import {IConsoleAppModuleConfig} from './IConsoleAppModuleConfig';
import {EntityCodeGenerateCommand} from '../../commands/entity-generator/EntityCodeGenerateCommand';
import {MigrateCommand} from '../../commands/MigrateCommand';
import {CommandModule} from 'nestjs-command';

const moduleNames = fs.readdirSync(process.cwd());
const isMigrateCommand = !!(process.argv || []).find(arg => /^migrate/.exec(arg));

export default {
    ...baseConfig,
    config: () => {
        const config = baseConfig.config();
        return {
            ...config,
            database: {
                ...config.database,
                migrations: isMigrateCommand
                    ? moduleNames.map(name => join(__dirname, `../${name}/infrastructure/migrations/*{.ts,.js}`))
                    : [], // Do not include migrations on web and other cli commands
                migrationsTableName: 'migrations',
            } as PostgresConnectionOptions
        } as IConsoleAppModuleConfig;
    },
    module: (config: IConsoleAppModuleConfig) => {
        const module = baseConfig.module(config);
        return {
            ...module,
            imports: [
                ...module?.imports,
                CommandModule,
            ],
            providers: [
                EntityCodeGenerateCommand,
                MigrateCommand,
            ],
        };
    },
};
