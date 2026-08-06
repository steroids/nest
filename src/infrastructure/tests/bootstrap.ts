import {Module} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {TypeOrmModule} from '@nestjs/typeorm';
import {PostgresDataSourceOptions} from 'typeorm/driver/postgres/PostgresDataSourceOptions';
import {join} from 'path';
import {ValidationExceptionFilter} from '../filters/ValidationExceptionFilter';
import {CreateDtoPipe} from '../pipes/CreateDtoPipe';
import {ModuleHelper} from '../helpers/ModuleHelper';
import {DatabaseNamingStrategy} from '../base/DatabaseNamingStrategy';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: () => ({
                type: 'postgres',
                host: process.env.TYPEORM_HOST,
                port: parseInt(process.env.TYPEORM_PORT, 10),
                database: process.env.TYPEORM_DATABASE,
                username: process.env.TYPEORM_USERNAME,
                password: process.env.TYPEORM_PASSWORD,
                entities: [join(__dirname, 'app/tables/*Table.ts')],
                migrationsTableName: 'test_migration',
                synchronize: true,
                // add 'query' for db queries logging
                logging: ['schema', 'warn', 'error', 'migration'],
                namingStrategy: new DatabaseNamingStrategy(),
            } as PostgresDataSourceOptions),
        }),
        TypeOrmModule.forFeature(ModuleHelper.importDir(join(__dirname, 'app/tables'))),
    ],
    providers: [
        ...ModuleHelper.importDir(join(__dirname, 'app/repositories')),
        ...ModuleHelper.importDir(join(__dirname, 'app/services')),
    ]
})
class AppModule {
}

export async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new CreateDtoPipe());
    app.useGlobalFilters(new ValidationExceptionFilter());
    app.init();

    return app;
}
