# Steroids Nest Migration Guide

## Unreleased

### Частичное сохранение в CrudRepository

`CrudRepository.save`, `saveInternal` и `update` теперь принимают `DeepPartial<TModel>`. При сохранении неполной модели результат также имеет тип `DeepPartial<TModel>`.

Если проект переопределяет `CrudRepository.saveInternal`, обновите типы аргумента и результата, чтобы они поддерживали частичные модели.

До:

```ts
async saveInternal(manager: ISaveManager<TModel>, nextModel: TModel): Promise<TModel> {
    return manager.save(nextModel);
}
```

После:

```ts
import {DeepPartial} from 'typeorm';

async saveInternal(
    manager: ISaveManager<TModel>,
    nextModel: TModel | DeepPartial<TModel>,
): Promise<TModel | DeepPartial<TModel>> {
    return manager.save(nextModel);
}
```

Если проект переопределяет `CrudService.saveInternal`, учтите, что `diffModel` при обновлении является частичной моделью.
После сохранения необходимо повторно загрузить модель по первичному ключу, если метод должен возвращать полный `TModel`.

До:

```ts
async saveInternal(
    prevModel: TModel | null,
    nextModel: TModel,
    diffModel: TModel,
    context?: ContextDto,
): Promise<TModel> {
    return this.repository.save(diffModel);
}
```

После:

```ts
import {DeepPartial} from 'typeorm';

async saveInternal(
    prevModel: TModel | null,
    nextModel: TModel,
    diffModel: DeepPartial<TModel>,
    context?: ContextDto,
): Promise<TModel> {
    if (prevModel) {
        const savedModel = await this.repository.save(diffModel);
        return this.findById(savedModel[this.primaryKey], context);
    }

    return this.repository.save(nextModel);
}
```

## [5.1.0](../CHANGELOG.md#510-2026-08-11) (2026-08-11)

### Поддержка NestJS 11

`@steroidsjs/nest` 5.1.0 одновременно поддерживает NestJS 10 и NestJS 11.
Обновление самого пакета не требует обязательного перехода на NestJS 11: проекты на NestJS 10 могут сохранить текущие версии зависимостей.

Для перехода приложения на NestJS 11 обновите основные NestJS-пакеты согласованно, не смешивая разные major-версии:

```json
{
  "dependencies": {
    "@nestjs/cli": "^11.0.24",
    "@nestjs/common": "^11.1.28",
    "@nestjs/core": "^11.1.28",
    "@nestjs/platform-express": "^11.1.28",
    "@nestjs/swagger": "^11.4.6"
  },
  "devDependencies": {
    "@types/express": "^5.0.6"
  }
}
```

NestJS 11 требует Node.js 20 или новее, а Nest CLI 11 — Node.js 20.11 или новее.
Перед обновлением также проверьте `peerDependencies` остальных NestJS- и `@steroidsjs/*`-пакетов приложения: поддержка NestJS 11 должна быть заявлена каждым из них отдельно.

### Переход на Express 5

`@nestjs/platform-express` использует Express 4 в NestJS 10 и Express 5 в NestJS 11.
`@steroidsjs/nest` больше не устанавливает собственную версию `express` и не добавляет вторую, несовместимую major-версию в дерево зависимостей.

Если приложение добавляло `express` только ради типов `Request` и `Response`, прямую runtime-зависимость можно удалить, оставив `@types/express`. При переходе на NestJS 11 обновите типы до Express 5 и используйте type-only imports:

```ts
import type {Request, Response} from 'express';
```

Если приложение напрямую создаёт Express Router или использует runtime API Express, его собственную зависимость `express` также необходимо обновить до версии 5.

В Express 5 изменился синтаксис маршрутов `path-to-regexp`. Проверьте wildcard-маршруты и middleware paths:

```text
/files/*  -> /files/*path
/*        -> /{*path}
```

Wildcard должен иметь имя, а форма `{*path}` используется, если маршрут должен совпадать и с корневым путём. Также проверьте код, который перезаписывает `request.query`: в Express 5 это getter, доступный только для чтения.

Кроме того, Express 5 по умолчанию использует упрощённый query parser вместо расширенного. Стандартный `RestApplication` явно устанавливает `query parser` в значение `extended`, поэтому вложенные параметры в bracket notation, например `filter[name]=value` или `tags[]=one&tags[]=two`, продолжат разбираться как объекты и массивы.

Подробнее об изменениях Express 5 и необходимых действиях читайте в [официальном migration guide NestJS](https://docs.nestjs.com/migration-guide#express-v5).

### Настройка парсеров запросов в `RestApplication`

`RestApplication` больше не подключает внешний `body-parser`. Ограничение размера запроса настраивается через `NestExpressApplication.useBodyParser`, поэтому один и тот же код использует совместимый parser и в NestJS 10, и в NestJS 11. Для сохранения расширенного разбора query-параметров при переходе на Express 5 приложение также явно устанавливает настройку `query parser`.

При использовании стандартного `RestApplication` дополнительных действий не требуется. Если проект переопределяет `createApp` или `initSettings`, используйте Express-тип приложения и штатный API адаптера:

```ts
import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';

protected _app: NestExpressApplication;

protected async createApp() {
    this._app = await NestFactory.create<NestExpressApplication>(this._moduleClass, {
        logger: this._config.loggerLevels,
    });
}

protected initSettings() {
    this._app.set('query parser', 'extended');

    this._app.useBodyParser('json', {
        limit: this._config.requestSizeLimit,
    });
    this._app.useBodyParser('urlencoded', {
        extended: true,
        limit: this._config.requestSizeLimit,
    });
}
```

Настройка `query parser` управляет разбором параметров из URL, а option `extended` у URL-encoded body parser — разбором тела запроса. Это независимые настройки, поэтому при переопределении `initSettings` нужны обе.

Если проект самостоятельно импортирует `body-parser`, его нужно оставить в зависимостях самого проекта. Удаление касается только внутреннего использования в `@steroidsjs/nest`.

### Metadata Field-декораторов и `DataMapper.exportModels`

Swagger 11 запрещает импорт закрытого модуля `@nestjs/swagger/dist/constants`. `DataMapper.exportModels` больше не зависит от Swagger metadata и читает `label` и `required` из публичных options Field-декораторов.

Если приложение использует результат `DataMapper.exportModels`, проверьте обязательность полей. Ранее экспортированное значение `required` фактически определялось выражением `nullable === false`; теперь оно соответствует option `required`:

```ts
@StringField({
    required: true,
    nullable: false,
})
name: string;
```

Указывайте `required` явно для полей, которые должны быть помечены обязательными в экспортированной модели. `nullable` продолжает описывать допустимость `null` и настройку соответствующей колонки, а `required` — обязательность заполнения поля.

## [5.0.0](../CHANGELOG.md#500-2026-07-23) (2026-07-23)

### Переход с форков TypeORM на оригинальные пакеты

Форки `@steroidsjs/typeorm` и `@steroidsjs/nest-typeorm` больше не используются.
Их необходимо заменить на оригинальные пакеты `typeorm` и `@nestjs/typeorm`.

Удалите старые зависимости и установите новые:

```shell
yarn remove @steroidsjs/typeorm @steroidsjs/nest-typeorm
yarn add typeorm@^1.1.0 @nestjs/typeorm@^11.0.3
```

Если зависимости редактируются вручную, в `package.json` должны использоваться следующие версии:

```json
{
  "dependencies": {
    "@nestjs/typeorm": "^11.0.3",
    "typeorm": "^1.1.0"
  }
}
```

Обновите импорты и устаревшие API:

| Было | Стало |
| --- | --- |
| `@steroidsjs/typeorm` | `typeorm` |
| `@steroidsjs/typeorm/...` | `typeorm/...` |
| `@steroidsjs/nest-typeorm` | `@nestjs/typeorm` |
| `Connection` | `DataSource` |
| `PostgresConnectionOptions` | `PostgresDataSourceOptions` |
| `queryBuilder.connection` | `queryBuilder.dataSource` |
| `queryRunner.connection` | `queryRunner.dataSource` |

Пример обновления конфигурации:

```ts
import {TypeOrmModule} from '@nestjs/typeorm';
import {PostgresDataSourceOptions} from 'typeorm/driver/postgres/PostgresDataSourceOptions';

const databaseOptions: PostgresDataSourceOptions = {
    type: 'postgres',
    host: process.env.APP_DATABASE_HOST,
    port: parseInt(process.env.APP_DATABASE_PORT, 10),
    database: process.env.APP_DATABASE_NAME,
    username: process.env.APP_DATABASE_USERNAME,
    password: process.env.APP_DATABASE_PASSWORD,
};

TypeOrmModule.forRoot(databaseOptions);
```

В TypeORM 1.x удалены `getFromContainer` и связанный с ним глобальный контейнер.
Миграции создаются непосредственно через конструктор класса, поэтому их конструкторы не должны требовать аргументов:

```ts
const migration = new MigrationClass();
```

Если проект переопределяет внутренний `ConnectionMetadataBuilder.buildMigrations`, необходимо также заменить
`this.connection` на `this.dataSource`.

## [4.4.2](../CHANGELOG.md#442-2026-06-26) (2026-06-26)

### Удаление `GracefulController`

Удалены `GracefulController` и `GracefulService`, а также связанная с ними настройка `gracefulEnabled` в `IRestAppModuleConfig`.

Это ломает обратную совместимость для проектов, которые:
- использовали встроенный `GET /health`;
- включали `gracefulEnabled` в конфиге REST-приложения;
- переопределяли `RestApplication.init()` и вызывали `this.initGraceful()`.

Теперь библиотека больше не добавляет `app.enableShutdownHooks()` автоматически и не предоставляет встроенный `GET /health`.
Если приложению по-прежнему нужен health-check, его нужно реализовать в проекте самостоятельно.

## [4.4.0](../CHANGELOG.md#440-2026-05-14) (2026-05-14)

### Добавление `RestApplication.initCookieParser`

Если в проекте был переопределен метод `RestApplication.init`, 
то в нём после создания приложения нужно вызвать метод `this.initCookieParser`.
Для подписи кук можно передать в конфиг приложения поле `cookieSecret`.

### Массивы DTO в `CreateDtoPipe`

Глобальный `CreateDtoPipe` по-прежнему создает DTO для одиночных `body`, `query` и параметров контроллера. Для массива DTO теперь нужно подключить локальный pipe и явно передать тип элемента массива:

```ts
import {Body, Post} from '@nestjs/common';
import {CreateDtoPipe} from '@steroidsjs/nest/infrastructure/pipes/CreateDtoPipe';

@Post('batch')
createMany(
    @Body(new CreateDtoPipe(StoreSaveDto))
    dtos: StoreSaveDto[],
) {
    return this.service.createMany(dtos);
}
```

Без `itemMetatype` глобальный pipe пропускает массив как есть, потому что runtime-тип параметра для `StoreSaveDto[]` в NestJS равен `Array`.

### Изменение `DateTimeField.skipSeconds`

`DateTimeField` теперь по умолчанию нормализует дату и время в формат `yyyy-MM-dd HH:mm:ss`.
Если проект рассчитывал на прежнее поведение с обрезанием секунд, нужно явно передать `skipSeconds: true`:

```ts
@DateTimeField({
    skipSeconds: true,
})
plannedAt: string;
```

### Обновление Field-декораторов

Публичные options Field-декораторов очищены от служебных параметров. При обновлении проекта нужно проверить места, где перечисленные ниже параметры Field-декораторов задавались вручную или где проектный код напрямую читал steroids metadata.

`jsType` больше не поддерживается. Для большинства полей ничего передавать вместо него не нужно: OpenAPI-тип задаётся самим декоратором. Если тип действительно зависит от проекта, используйте `swaggerType`, но только в декораторах, где он остался публичным: `ComputableField`, `JSONBField` и `GeometryField`.

`dbType` больше не передаётся через Field-декораторы. Типы колонок остаются на уровне TypeORM-декораторов. Если проект переопределял `dbType` в Field options, такую настройку нужно перенести в TypeORM-слой или отдельный проектный декоратор.

`plainName` и `hint` удалены как неиспользуемые параметры. Их нужно просто убрать из options.

`RelationField` больше не принимает `isArray`. Массивность теперь определяется из типа связи: `ManyToMany` и `OneToMany` считаются массивами, `OneToOne` и `ManyToOne` - одиночными связями. Для `RelationIdField` поведение не меняется: если поле id связи хранит массив значений, `isArray: true` по-прежнему нужно передать явно.

Если проектный код читает metadata напрямую, нужно учитывать новое разделение:

- `getFieldOptions(MetaClass, fieldName)` возвращает пользовательские options поля.
- `getFieldInternalOptions(MetaClass, fieldName)` возвращает служебные options: `appType`, `decoratorName`, `swaggerType`.
- `getFieldAppType(MetaClass, fieldName)` возвращает `appType`.
- `getFieldDecoratorName(MetaClass, fieldName)` сохраняет прежнее поведение, но читает имя декоратора из internal options.

Если использовались metadata-константы, нужно заменить старые ключи:

```text
STEROIDS_META_FIELD -> STEROIDS_META_FIELD_OPTIONS
STEROIDS_META_FIELD_DECORATOR -> STEROIDS_META_FIELD_INTERNAL_OPTIONS
```

Старые helper-экспорты из `BaseField` сохранены для обратной совместимости, но новая реализация находится в `src/infrastructure/decorators/fields/helpers/InternalFieldMetadataHelpers.ts`.

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
