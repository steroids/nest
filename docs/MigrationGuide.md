# Steroids Nest Migration Guide

### Переход на @sentry/nestjs

Необходимо удалить библиотеки:
- `@ntegral/nestjs-sentry`
- `@sentry/node`

Необходимо установить библиотеки:
- `@sentry/nestjs`

В местах, где использовалось 
```ts 
import * as Sentry from '@sentry/node'
``` 
заменить библиотеку на `@sentry/nestjs`

Если был переопределён класс `RestApplication`, то проверить:
- метод `initSentry`: был удален из `RestApplication` и перемещён в `BaseApplication`, должен вызываться до создания `NestJS`-приложения
(по умолчанию вызывается в `init` класса `BaseApplication`)
- метод `initFilters`: теперь `SentryExceptionFilter` инициализируется в этом методе, а не в `initSentry`

Если в импортах `AppModule` был переопределён `SentryModule` из базового конфига, то:
- настройки `SentryModule` из `@ntegral/nestjs-sentry` перенести в `Sentry.init` внутри метода `initSentry` класса `RestApplication` (он наследуется от `BaseApplication`)
- использовать `SentryModule.forRoot()` из `@sentry/nestjs/setup`

## [4.0.0](../CHANGELOG.md#400-2026-01-19) (2026-01-19)

### обновление до NestJS 10

В проекте необходимо обновить NestJS и связанные с ним зависимости до 10 версий.
Также нужно обновить все "@steroidsjs/* зависимости до версий, указанных в примере, или новее.
Пример с версиями на момент написания этого MigrationGuide:

```json
{
  "dependencies": {
    "@nestjs/axios": "^3.0.0",
    "@nestjs/cache-manager": "^3.0.1",
    "@nestjs/cli": "^10.4.9",
    "@nestjs/common": "^10.4.19",
    "@nestjs/core": "^10.4.19",
    "@nestjs/event-emitter": "^3.0.1",
    "@nestjs/platform-express": "^10.4.19",
    "@nestjs/swagger": "^8.1.1",
    "@nestjs/schedule": "^6.0.0",

    "@steroidsjs/nest": "^4.0.0",
    "@steroidsjs/nest-file": "^0.4.1",
    "@steroidsjs/nest-modules": "^0.1.5",
    "@steroidsjs/nest-notifier": "^0.4.0",
    "@steroidsjs/nest-typeorm": "^10.0.3"
  }
}
```

Если в проекте используется CacheModule из ```@nestjs/common```, необходимо заменить его на реализацию из отдельного пакета
```@nestjs/cache-manager```

## [3.2.0](../CHANGELOG.md#320-2025-02-28) (2025-05-12)

### Вынос инфраструктурной логики ORM из *Fields декораторов

Теперь *Fields декораторы не включают в себя код TypeORM.
Необходимые декораторы из TypeORM применяет новый декоратор ```TypeOrmTableFromModel```
В проекте необходимо заменить использование ```TableFromModel``` на ```TypeOrmTableFromModel```

До
```ts
import {IDeepPartial} from '@steroidsjs/nest/usecases/interfaces/IDeepPartial';
import {TableFromModel} from '@steroidsjs/nest/infrastructure/decorators/TableFromModel';
import {AuthConfirmModel} from '@steroidsjs/nest-auth/domain/models/AuthConfirmModel';

@TableFromModel(AuthConfirmModel, 'auth_confirm')
export class AuthConfirmTable implements IDeepPartial<AuthConfirmModel> {}
```

После
```ts
import {IDeepPartial} from '@steroidsjs/nest/usecases/interfaces/IDeepPartial';
import {TypeOrmTableFromModel} from '@steroidsjs/nest/infrastructure/decorators/typeorm/TypeOrmTableFromModel';
import {AuthConfirmModel} from '@steroidsjs/nest-auth/domain/models/AuthConfirmModel';

@TypeOrmTableFromModel(AuthConfirmModel, 'auth_confirm')
export class AuthConfirmTable implements IDeepPartial<AuthConfirmModel> {}
```

## [3.0.3](../CHANGELOG.md#303-2025-02-28) (2025-02-28)

### Рефакторинг процесса сохранения модели

Методы сохранения модели в CrudService и метод saveInternal в CrudRepository теперь явно возвращают сохраненную модель, а не мутируют передаваемую в них nextModel
Если в проекте используется переопределение метода saveInternal в CrudService, необходимо обновить их следующим образом:

До
```ts
async saveInternal(prevModel: StoreModel | null, nextModel: StoreModel, context?: ContextDto) {
    await this.repository.save(nextModel);
}
```

После
```ts
async saveInternal(prevModel: StoreModel | null, nextModel: StoreModel, diffModel: StoreModel, context?: ContextDto) {
    return this.repository.save(diffModel);
}
```

Также, если в проекте используется переопределение метода saveInternal в CrudRepository, необходимо обновить их следующим образом:

До
```ts
async saveInternal(manager: ISaveManager, nextModel: TModel) {
    await manager.save(nextModel);
}
```

После
```ts
async saveInternal(manager: ISaveManager, nextModel: TModel) {
    return manager.save(nextModel);
}
```

## [3.0.0](../CHANGELOG.md#300-2024-02-18) (2025-02-18)

### diffModel в CrudService

Если в проекте используется переопределение метода saveInternal в CrudService, необходимо добавить в него аргумент diffModel
и передавать его в save метод репозитория. Пример:

До
```ts
async saveInternal(prevModel: StoreModel | null, nextModel: StoreModel, context?: ContextDto) {
    await this.repository.save(nextModel);
}
```

После
```ts
async saveInternal(prevModel: StoreModel | null, nextModel: StoreModel, diffModel: StoreModel, context?: ContextDto) {
    await this.repository.save(diffModel);
}
```

### ModuleHelper.provide

Метод ModuleHelper.provide теперь отмечен как deprecated, рекомендуется использовать стандартные инструменты NestJS для подключения
провайдеров в модуль. Пример:

До
```ts
@Module({
    module: () => ({
        providers: [
            ModuleHelper.provide(SyncMessageService, [
                ISyncMessageRepository,
            ]),
        ],
    }),
})
export class SyncModule {
}

class SyncMessageService {
    constructor(
       private readonly syncMessageRepository: ISyncMessageRepository,
    ) {}
}
```

После
```ts
@Module({
    module: () => ({
        providers: [
            SyncMessageService
        ],
    }),
})
export class SyncModule {
}

@Injectable()
class SyncMessageService {
    constructor(
        @Inject(ISyncMessageRepository)
        private readonly syncMessageRepository: ISyncMessageRepository,
    ) {}
}
```

### Типизация *Table классов

Для корректной типизации *Table классов рекомендуется заменить использование интерфейса IDeepPartial на наследование *Table
класса от класса соответствующей модели. Пример:

До
```ts
@TableFromModel(SyncMessageModel, 'sync_message')
export class SyncMessageTable implements IDeepPartial<SyncMessageModel> {}
```

После
```ts
@TableFromModel(SyncMessageModel, 'sync_message')
export class SyncMessageTable extends SyncMessageModel {}
```
