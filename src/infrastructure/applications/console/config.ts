import {PostgresConnectionOptions} from '@steroidsjs/typeorm/driver/postgres/PostgresConnectionOptions';
import * as path from 'path';
import * as fs from 'node:fs';
import baseConfig from '../base/config';
import {IConsoleAppModuleConfig} from './IConsoleAppModuleConfig';
import {EntityCodeGenerateCommand} from '../../commands/entity-generator/EntityCodeGenerateCommand';
import {MigrateCommand} from '../../commands/MigrateCommand';
import {CommandModule} from 'nestjs-command';

const isMigrateCommand = !!(process.argv || []).find(arg => /^migrate/.exec(arg));

// For deployment to use files in dist directory.
const envRootDir = process.env.APP_ENVIRONMENT === 'dev' ? 'src' : 'dist';

/**
 * If CLI_PATH is specified then use directory from it.
 */
const migrationsRootDir = process.env.CLI_PATH && path.dirname(process.env.CLI_PATH)
    ? path.dirname(process.env.CLI_PATH).split(path.sep).find(dir => !dir.includes('.'))
    : envRootDir;

export default {
    ...baseConfig,
    config: () => {
        const config = baseConfig.config();
        return {
            ...config,
            database: {
                ...config.database,
                migrations: isMigrateCommand
                    ? fs.readdirSync(migrationsRootDir).map(name => path.join(migrationsRootDir, `${name}/infrastructure/migrations/*{.ts,.js}`))
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
