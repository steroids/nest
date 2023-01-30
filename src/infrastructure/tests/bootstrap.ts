import {Module} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {TypeOrmModule} from '@steroidsjs/nest-typeorm';
import {PostgresConnectionOptions} from '@steroidsjs/typeorm/driver/postgres/PostgresConnectionOptions';
import {ValidationExceptionFilter} from '../filters/ValidationExceptionFilter';
import {CreateDtoPipe} from '../pipes/CreateDtoPipe';
import {ModuleHelper} from '../helpers/ModuleHelper';
import {join} from 'path';
import {DatabaseNamingStrategy} from '../base/DatabaseNamingStrategy';
import {UserExceptionFilter} from "../filters/UserExceptionFilter";

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
                logging: ['schema', 'warn', 'error', 'migration'/*, 'query'/**/],
                namingStrategy: new DatabaseNamingStrategy(),
            } as PostgresConnectionOptions),
        }),
        TypeOrmModule.forFeature(ModuleHelper.importDir(__dirname + '/app/tables')),
    ],
    providers: [
        ...ModuleHelper.importDir(__dirname + '/app/repositories'),
        ...ModuleHelper.importDir(__dirname + '/app/services'),
    ]
})
class AppModule {
}

export async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new CreateDtoPipe());
    app.useGlobalFilters(new ValidationExceptionFilter(),new UserExceptionFilter());
    app.init();

    return app;
}
