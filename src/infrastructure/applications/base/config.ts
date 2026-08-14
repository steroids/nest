import {TypeOrmModule, TypeOrmModuleOptions} from '@nestjs/typeorm';
import {PostgresDataSourceOptions} from 'typeorm/driver/postgres/PostgresDataSourceOptions';
import {SentryModule} from '@sentry/nestjs/setup';
import {EventEmitterModule} from '@nestjs/event-emitter';
import {ModuleHelper} from '../../helpers/ModuleHelper';
import {AppModule} from '../AppModule';
import {IAppModuleConfig} from '../IAppModuleConfig';
import {DatabaseNamingStrategy} from '../../base/DatabaseNamingStrategy';

export default {
    rootTarget: AppModule,
    config: () => ({
        name: 'app',
        title: 'Application',
        version: '1.0',
        loggerLevels: ['error', 'warn'],
        database: {
            type: 'postgres',
            host: process.env.APP_DATABASE_HOST,
            port: parseInt(process.env.APP_DATABASE_PORT, 10),
            database: process.env.APP_DATABASE_NAME,
            username: process.env.APP_DATABASE_USERNAME,
            password: process.env.APP_DATABASE_PASSWORD,
            synchronize: false,
            migrationsRun: false,
            // add 'query' for db queries logging
            logging: ['schema', 'warn', 'error', 'migration'],
            namingStrategy: new DatabaseNamingStrategy(),
        } as PostgresDataSourceOptions,
    } as IAppModuleConfig),
    module: (config: IAppModuleConfig) => ({
        imports: [
            TypeOrmModule.forRoot({
                ...config.database,
                entities: ModuleHelper.getEntities(),
            } as TypeOrmModuleOptions),
            config.sentry && SentryModule.forRoot(),
            EventEmitterModule.forRoot(),
        ].filter(Boolean),
    }),
};
