import {PostgresDataSourceOptions} from 'typeorm/driver/postgres/PostgresDataSourceOptions';
import * as path from 'path';
import * as fs from 'node:fs';
import {CommandModule} from 'nestjs-command';
import baseConfig from '../base/config';
import {IConsoleAppModuleConfig} from './IConsoleAppModuleConfig';
import {EntityCodeGenerateCommand} from '../../commands/entity-generator/EntityCodeGenerateCommand';
import {MigrateCommand} from '../../commands/MigrateCommand';

const isMigrateCommand = !!(process.argv || []).find(arg => /^migrate/.exec(arg));

// search migrations in modules and subModules
const collectMigrations = (modulePath: string, migrations: string[] = []) => {
    fs.readdirSync(modulePath).forEach(moduleName => {
        migrations.push(path.join(modulePath, `${moduleName}/infrastructure/migrations/*{.ts,.js}`));

        const childModulesPath = path.join(modulePath, `${moduleName}/modules`);
        if (fs.existsSync(childModulesPath)) {
            collectMigrations(childModulesPath, migrations);
        }
    })
    return migrations;
}

export default {
    ...baseConfig,
    config: () => {
        const config = baseConfig.config();

        // For deployment to use files in dist directory.
        const envRootDir = process.env.APP_ENVIRONMENT === 'dev' ? 'src' : 'dist';

        // If CLI_PATH is specified then use directory from it.
        const migrationsRootDir = process.env.CLI_PATH && path.dirname(process.env.CLI_PATH)
            ? path.dirname(process.env.CLI_PATH).split(path.sep).find(dir => !dir.includes('.'))
            : envRootDir;

        return {
            ...config,
            database: {
                ...config.database,
                migrations: isMigrateCommand
                    ? collectMigrations(migrationsRootDir)
                    // Do not include migrations on web and other cli commands
                    : [],
                migrationsTableName: 'migrations',
            } as PostgresDataSourceOptions
        } as IConsoleAppModuleConfig;
    },
    module: (config: IConsoleAppModuleConfig) => {
        const module = baseConfig.module(config);
        return {
            ...module,
            imports: [
                ...(module?.imports || []),
                CommandModule,
            ],
            providers: [
                EntityCodeGenerateCommand,
                MigrateCommand,
            ],
        };
    },
};
