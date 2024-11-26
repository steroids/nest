import {TypeOrmModule, TypeOrmModuleOptions} from '@steroidsjs/nest-typeorm';
import {PostgresConnectionOptions} from '@steroidsjs/typeorm/driver/postgres/PostgresConnectionOptions';
import {SentryModule} from '@ntegral/nestjs-sentry';
import {ModuleHelper} from '../../helpers/ModuleHelper';
import {AppModule} from '../AppModule';
import {IAppModuleConfig} from '../IAppModuleConfig';
import {DatabaseNamingStrategy} from '../../base/DatabaseNamingStrategy';
import {LoggerModule} from 'nestjs-pino';
import loggerConfig from '../../loggers/config';
import {DatabaseLogger} from '../../loggers/DatabaseLogger';

export default {
    rootTarget: AppModule,
    config: () => ({
        name: 'app',
        title: 'Application',
        version: '1.0',
        database: {
            type: 'postgres',
            host: process.env.APP_DATABASE_HOST,
            port: parseInt(process.env.APP_DATABASE_PORT, 10),
            database: process.env.APP_DATABASE_NAME,
            username: process.env.APP_DATABASE_USERNAME,
            password: process.env.APP_DATABASE_PASSWORD,
            synchronize: false,
            migrationsRun: false,
            logger: new DatabaseLogger(),
            logging: ['schema', 'warn', 'error', 'migration'/*, 'query'/**/],
            namingStrategy: new DatabaseNamingStrategy(),
        } as PostgresConnectionOptions,
        logger: loggerConfig,
    } as IAppModuleConfig),
    module: (config: IAppModuleConfig) => ({
        imports: [
            LoggerModule.forRoot(config.logger),
            TypeOrmModule.forRoot({
                ...config.database,
                entities: ModuleHelper.getEntities(),
            } as TypeOrmModuleOptions),
            config.sentry && SentryModule.forRoot({
                dsn: config.sentry.dsn,
                environment: config.sentry.environment || process.env.APP_ENVIRONMENT,
            }),
        ].filter(Boolean),
    }),
};
