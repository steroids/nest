# Транзакции

В проектах на базе Steroids для выполнения нескольких задач в одной транзакции
используется [форк библиотеки typeorm-transactional](https://github.com/steroids/typeorm-transactional).

[Ссылка на typeorm-transactional](https://www.npmjs.com/package/typeorm-transactional)

### Подключение

В глобальном модуле проекта необходимо определить интерфейс для сервиса,
содержащего метод обёртывания функции в транзакцию, 
и токен, по которому данный сервис будет находиться в DI-контейнере:

```typescript
export interface IUnitOfWorkService {
    execute<Fn extends (this: any, ...args: any[]) => ReturnType<Fn>>(
        fn: Fn,
    ): ReturnType<Fn>
}

export const IUnitOfWorkService = 'IUnitOfWorkService';
```

Далее необходимо в инфраструктурной части модуля определить сервис, реализующий данный интерфейс:
```typescript
import {Injectable} from '@nestjs/common';
import {wrapInTransaction} from '@steroidsjs/typeorm-transactional';
import {WrapInTransactionOptions} from '@steroidsjs/typeorm-transactional/dist/transactions/wrap-in-transaction';
import {IUnitOfWorkService} from '../../domain/interfaces/IUnitOfWorkService';

@Injectable()
export class UnitOfWork implements IUnitOfWorkService {
    execute<Fn extends(this: any, ...args: any[]) => ReturnType<Fn>>(
        fn: Fn,
        options?: WrapInTransactionOptions): ReturnType<Fn> {
        return wrapInTransaction(fn, options)();
    }
}
```
Подключить данный класс в глобальный модуль:

```typescript
import {Module} from '@steroidsjs/nest/infrastructure/decorators/Module';
import {IUnitOfWorkService} from './domain/interfaces/IUnitOfWorkService';
import {UnitOfWork} from './infrastructure/services/UnitOfWork';

@Module({
    global: true,
    module: () => ({
        providers: [
            {
                provide: IUnitOfWorkService,
                useClass: UnitOfWork,
            },
        ],
        exports: [IUnitOfWorkService],
    }),
})
export class GlobalModule {}
```

В главном модуле приложения нужно определить `dataSourceFactory` модуля `TypeOrmModule`:

```typescript
import {Module} from '@steroidsjs/nest/infrastructure/decorators/Module';
import baseConfig from '@steroidsjs/nest/infrastructure/applications/rest/config';
import {TypeOrmModule} from '@steroidsjs/nest-typeorm';
import {addTransactionalDataSource} from '@steroidsjs/typeorm-transactional';
import {DataSource} from '@steroidsjs/typeorm';
import {RestApplication} from './RestApplication';
import {GlobalModule} from './global/GlobalModule';

@Module({
    ...baseConfig,
    module: (config: any) => {
        const module = baseConfig.module(config);
        return {
            ...module,
            imports: [
                GlobalModule,
                TypeOrmModule.forRootAsync({
                    useFactory: () => config.database,
                    dataSourceFactory: async (options) => {
                        if (!options) {
                            throw new Error('Invalid options passed');
                        }

                        return addTransactionalDataSource(new DataSource(options));
                    },
                }),
            ],
        };
    },
})
export class AppModule {}
```

Также в классе `RestApplication` нужно добавить в метод `init` инициализацию контекста транзакций:

```typescript
import {RestApplication as BaseRestApplication} from '@steroidsjs/nest/infrastructure/applications/rest/RestApplication';
import {initializeTransactionalContext, StorageDriver} from '@steroidsjs/typeorm-transactional';

export class RestApplication extends BaseRestApplication {
    public async init() {
        initializeTransactionalContext({
            storageDriver: StorageDriver.AUTO,
        });
        //...
    }
    //...
}
```

### Использование

Транзакции следует использовать, когда требуется выполнить несколько запросов
к базе данных как единое целое с возможностью отката всех изменений в случае ошибки:

```typescript
@Injectable()
export class OrderUpdatePricesUseCase {
    constructor(
        @Inject(OrderService)
        private readonly orderService: OrderService,
        @Inject(OrderPositionService)
        private readonly orderPositionService: OrderPositionService,
        @Inject(IUnitOfWorkService)
        private readonly unitOfWorkService: IUnitOfWorkService,
    ) {}

    public async handle(dto: OrderPricesUpdateDto, context: ContextDto): Promise<OrderModel> {
        return this.unitOfWorkService.execute(async () => {
            await this.orderPositionService.updatePrices(dto, context);
            return this.orderService.updatePrices(dto, context);
        });
    }
}
```

По умолчанию `typeorm-transactional` использует уровень изоляции транзакций,
установленный в настройках драйвера базы данных. Например, для `PostgreSQL` это будет `READ COMMITTED`.

Также уровень изоляции можно настроить для каждого вызова метода `execute`,
передав вторым параметром объект с полем `isolationLevel`, указывающим нужное значение.

