# Steroids Nest Migration Guide

## [Unreleased](../CHANGELOG.md#Unreleased) (2026-^^-^^)

### Добавление `RestApplication.initCookieParser`

Если в проекте был переопределен метод `RestApplication.init`, 
то в нём после создания приложения нужно вызвать метод `super.initCookieParser`.
Для подписи кук можно передать в конфиг приложения поле `cookieSecret`.

## [4.3.0](../CHANGELOG.md#430-2026-05-04) (2026-05-04)

### Настройка роутинга в RestApplication

В базовом `RestApplication` настройка глобального префикса и URI versioning вынесена из `initSwagger` в отдельный метод `initRouting`.
Если в проекте используется стандартный `RestApplication` без переопределения `init`, дополнительных действий не требуется.

Если в проекте переопределен метод `init`, нужно вызвать `initRouting` после создания NestJS-приложения и до инициализации Swagger:

```ts
public async init() {
    await super.init();

    await this.createApp();

    this.initRouting();
    this.initSwagger();
    this.initCors();
    this.initPipes();
    this.initFilters();
    this.initInterceptors();
    this.initSettings();
    this.initGraceful();
}
```

Если в проекте переопределен `initSwagger` и внутри него вручную вызывается `setGlobalPrefix('/api/v1')` или `enableVersioning`, эту настройку нужно перенести в `initRouting` или удалить дубль. Базовое поведение теперь задает глобальный префикс `/api` и `defaultVersion: '1'`, что сохраняет адреса вида `/api/v1/...`.

### Sentry

Sentry теперь инициализируется только если в конфиге задан `sentry.dsn`, а `SentryExceptionFilter` подключается только при наличии клиента Sentry.
Если проект использует стандартный REST-конфиг и переменную окружения `APP_SENTRY_DSN`, дополнительных действий не требуется.

Если в проекте переопределен конфиг приложения, нужно убедиться, что при включенной интеграции передается DSN:

```ts
sentry: {
    dsn: process.env.APP_SENTRY_DSN,
    environment: process.env.APP_ENVIRONMENT,
}
```

Если Sentry не используется, можно не передавать `sentry` в конфиг или оставить `APP_SENTRY_DSN` пустым.

### UserException

`UserException` и `UserExceptionFilter` помечены как deprecated.
Обновление не требует срочной замены, но в новом коде рекомендуется использовать стандартные HTTP-исключения NestJS или проектные исключения с собственными фильтрами.

## [4.2.0](../CHANGELOG.md#420-2026-04-02) (2026-04-02)

### Переход на @sentry/nestjs

Чтобы перейти с `@ntegral/nestjs-sentry` на `@sentry/nestjs` нужно:

1. Удалить библиотеки:
- `@ntegral/nestjs-sentry`
- `@sentry/node`

2. Установить библиотеки:
- `@sentry/nestjs`

3. Заменить на импорт из библиотеки `@sentry/nestjs` в местах, где использовалось 
```ts 
import * as Sentry from '@sentry/node'
``` 

4. Если был переопределёны методы `init`, `initFilters` или `initSentry` класса `RestApplication`, то:
- перенести инициализацию `SentryExceptionFilter` из `initSentry` в `initFilters`
- удалить метод `initSentry` или вызвать в нём `super.initSentry`
- метод `initSentry` вызвать в `init` до создания NestJS-приложения, но после метода `initConfig`, если уже не вызван `super.init`

5. Если в импортах `AppModule` был переопределён `SentryModule` из базового конфига, то:
- настройки `SentryModule` из `@ntegral/nestjs-sentry` перенести в `Sentry.init` внутри метода `initSentry` класса `RestApplication` (он наследуется от `BaseApplication`)
- использовать `SentryModule.forRoot()` из `@sentry/nestjs/setup`

### Требования к паролю

Если вы используете в проекте `@PasswordField`, то сейчас в нём проверяется сложность пароля. По умолчанию настройки такие:
- Минимальная длина: 8
- Минимальное количество букв в нижнем регистре: 1
- Минимальное количество букв в верхнем регистре: 1
- Минимальное количество цифр: 1
- Минимальное количество специальных символов (```-#!$@£%^&*()_+|~=`{}\[\]:";'<>?,.\/\\ ```): 0

Если эти настройки не соответствуют требованиям проекта, то нужно передать в `@PasswordField` корректные параметры

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

## [3.2.0](../CHANGELOG.md#320-2025-05-12) (2025-05-12)

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

## [3.0.0](../CHANGELOG.md#300-2025-02-18) (2025-02-18)

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
