# Запуск приложения

Для запуска приложения на Steroids существуют два класса - `RestApplication` и `ConsoleApplication`.
Первый класс запускает приложение в API-режиме, второй - в консольном.
Они оба наследуют абстрактный класс `BaseApplication`.

## BaseApplication

Данный класс используется для создания разных классов приложений путём его наследования.

### Конфигурация

---

Конфигурация, используемая в этом классе, представлена интерфейсом `IAppModuleConfig`,
который также должны наследовать интерфейсы конфигураций других модулей.
Интерфейс `IAppModuleConfig` содержит следующие поля:

`name` - название приложения (по умолчанию `app`)

`title` - заголовок для Swagger (по умолчанию `Application`)

`version` - версия приложения (по умолчанию `1.0`)

`database.host` - хост базы данных (значение из `process.env.APP_DATABASE_HOST`)

`database.port` - порт базы данных (значение из `process.env.APP_DATABASE_PORT`)

`database.database` - название базы данных (значение из `process.env.APP_DATABASE_NAME`)

`database.username` - имя пользователя в СУБД (значение из `process.env.APP_DATABASE_USERNAME`)

`database.password` - пароль пользователя в СУБД (значение из `process.env.APP_DATABASE_PASSWORD`)

`sentry.dsn` - DSN Sentry

`sentry.environment` - окружение приложения для Sentry

Также в `database` можно добавить любой ключ.

Другие свойства конфигурации, которых нет в данном интерфейсе, но есть в файле окружения:

`process.env.APP_ENVIRONMENT` - окружение проекта

О [расширении конфигурации](#расширение-конфигурации) написано ниже.

### Свойства

---

`_config`

Объект конфигурации проекта

### Методы

---

```typescript
protected async init(): Promise<void>
```
Метод инициализации проекта, который вызывает три других метода (`initEnv`, `initConfig`, `initModules`). 

```typescript
protected initEnv(): void
```

Метод для инициализации переменных окружения. Он использует библиотеку `dotenv` для загрузки переменных из файла `.env`.
Если переменная `APP_ENVIRONMENT` отсутствует в файле окружения, выбрасывается ошибка `APP_ENVIRONMENT is not found in env file`. 

```typescript
protected initConfig(): void
```

Пустой метод, который можно переопределить в наследниках класса для инициализации конфигурации приложения. 

```typescript
protected initModules(): void
```

Метод для инициализации модулей приложения.
Он использует класс `ModuleHelper`. 

```typescript
public abstract start(): void
```

Абстрактный метод для запуска приложения.

## RestApplication

Класс настройки и запуска REST API приложения.

### Конфигурация

---

Конфигурация, используемая в этом классе, представлена интерфейсом `IRestAppModuleConfig`,
который наследуется от интерфейса `IAppModuleConfig`, поэтому содержит поля из родительского интерфейса.
Собственные поля интерфейса `IRestAppModuleConfig`:

`requestSizeLimit` - максимальный размер тела запроса

`cors.allowDomains` - список доменов, которым разрешено отправлять запросы сервер

`cors.allowMethods` - список HTTP-методов, которые разрешены для запросов

`cors.allowHeaders` - список заголовков HTTP-запросов, которые разрешены при отправке данных на сервер

`gracefulEnabled` - флаг, указывающий, включено ли безопасное завершение работы приложения

Другие свойства конфигурации, которых нет в данном интерфейсе, но есть в файле окружения:

`process.env.PORT` - порт приложения

`process.env.APP_SENTRY_DSN` - флаг, показывающий подключен ли проект к Sentry

`process.env.K8S_READINESS_FAILURE_THRESHOLD` - количество последовательных провалов проверки готовности (readiness probe) в Kubernetes, после которых контейнер считается неготовым.
         
`process.env.K8S_READINESS_PERIOD_SECONDS` - интервал времени (в секундах) между проверками готовности.

О [расширении конфигурации](#расширение-конфигурации) написано ниже.

### Свойства

---

`_app`

Экземпляр приложения, созданного с помощью NestJS.

`_moduleClass`

Класс модуля приложения (по умолчанию это `AppModule`).

`_config`

Конфигурация приложения (наследуется от `BaseApplication`), которая определяется интерфейсом `IRestAppModuleConfig`.

### Методы

```typescript
protected initConfig(): void
```

Переопределение метода `initConfig` из базового класса для инициализации конфигурации приложения.
Использует `ModuleHelper.getConfig` для получения пользовательской конфигурации и объединяет её со значениями по умолчанию.

```typescript
protected initSwagger(): void 
```

Инициализация Swagger для генерации документации API.
Документация станет доступна по эндпоинту `/api/docs`.

```typescript
protected initCors(): void
```

Настройка CORS (Cross-Origin Resource Sharing). На основе конфигурации добавляет разрешенные домены и методы запросов.

```typescript
protected initPipes(): void
```

Инициализация глобальных пайпов, используемых для валидации данных запроса (по умолчанию используется `CreateDtoPipe`).

```typescript
protected initFilters(): void
```

Инициализация глобальных фильтров исключений (по умолчанию используются `ValidationExceptionFilter` и `UserExceptionFilter`).

```typescript
protected initSentry(): void
```

Инициализации Sentry для отслеживания и логирования ошибок.
Если переменная окружения `APP_SENTRY_DSN` установлена, добавляется фильтр `SentryExceptionFilter`.

```typescript
protected initInterceptors(): void
```

Инициализация глобальных интерсепторов (по умолчанию используется `SchemaSerializer`).

```typescript
protected initSettings(): void
```

Настройка парсеров тела запроса с ограничением размера запроса.

```typescript
protected initGraceful(): void
```

Включение безопасного завершения работы приложения, если в конфигурации включено свойство `gracefulEnabled`.

```typescript
public async init(): Promise<void>
```

Инициализация проекта.
Применяет все методы `init*`, а также создает экземпляр приложения с помощью `NestFactory.create`.

```typescript
public async start(): Promise<void>
```

Запуск приложения. Вызывает метод `init` и затем запускает сервер на указанном порту.

```typescript
public getApp(): any
```

Метод для получения экземпляра приложения (`_app`).


## ConsoleApplication

Класс настройки и запуска CLI приложения.
В основном используется для работы с миграциями.
[Команды "из коробки"](Migration.md#команды).

### Конфигурация

---

Конфигурация, используемая в этом классе, представлена интерфейсом `IConsoleAppModuleConfig`,
который наследуется от интерфейса `IAppModuleConfig`, поэтому содержит поля из родительского интерфейса.

Свойства конфигурации, которых нет в интерфейсе, но есть в файле окружения:

`process.env.CLI_PATH` - директория для выполнения консольных команд 
(по умолчанию если `process.env.APP_ENVIRONMENT` равен `dev`, то `scr`, иначе `dist`)

`process.env.APP_IS_CLI` - флаг, показывающий запущено ли приложение в консольном виде
(устанавливается автоматически при запуске `ConsoleApplication`)

О [расширении конфигурации](#расширение-конфигурации) написано ниже.

### Свойства

---

`_app`

Экземпляр приложения, созданного с помощью NestJS.

`_moduleClass`

Класс модуля приложения (по умолчанию это `AppModule`).


### Методы

---

`protected initEnv(): void`

Инициализация окружения проекта. 
Устанавливает переменную окружения `APP_IS_CLI` в значение `1`.
Вызывает метод инициализации окружения базового класса.


`public async start(): Promise<void>`

Запуск приложения.
Выполняет команду, переданную из терминала,
при этом создаёт контекст приложения только на время выполнения команды.

## Расширение конфигурации

Для расширения конфигурации нужно создать нужно создать новый тип/интерфейс,
который будет содержать/наследовать поля базового интерфейса.
Рассмотрим на примере конфига для `RestApplication`.


Функция `config` внутри декоратора `@Module`, используемого для класса модуля приложения,
должна возвращать значение того же типа,
который был определён ранее. 
Это возвращённое значение затем можно использовать в функции `module` того же декоратора.

```typescript
import {IRestAppModuleConfig} from '@steroidsjs/nest/infrastructure/applications/rest/IRestAppModuleConfig';
import {Module} from '@steroidsjs/nest/infrastructure/decorators/Module';
import baseConfig from '@steroidsjs/nest/infrastructure/applications/rest/config';
import {LoggerModule, Params as LoggerParams} from 'nestjs-pino';

type AppModuleConfig = IRestAppModuleConfig & {logger: LoggerParams};

@Module({
    ...baseConfig,
    config: () => {
        const config: IRestAppModuleConfig = baseConfig.config();

        return {
            ...config,
            logger: {
                exclude: [{method: RequestMethod.ALL, path: 'health'}],
            } as LoggerParams,
        } as AppModuleConfig;
    },
    module: (config: AppModuleConfig) => {
        const module = baseConfig.module(config);
        return {
            ...module,
            imports: [
                ...module.imports,
                LoggerModule.forRoot(config.logger),
            ],
        };
    },
})
export class AppModule {}
```
