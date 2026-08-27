# Steroids Nest Changelog

## [Unreleased](https://github.com/steroids/nest/compare/4.4.0...HEAD)

[Migration guide](docs/MigrationGuide.md#unreleased)

### Changed

- Обработка `required` и `nullable` унифицирована во всех Field-декораторах. В Swagger они явно передаются как `required: false` и `nullable: false`, если options не заданы.
- Поддержка `isArray` теперь объявлена только в Field-декораторах, которые её реализуют. Для них добавлена проверка типа массива и корректные OpenAPI metadata.
- `FileField` и `ImageField` используют `isArray` вместо `multiple`.

### Features

- В поддерживаемых `isArray` полях добавлены `arrayOptions`: `notEmpty`, `minLength` и `maxLength`, включая настройку сообщений валидации и OpenAPI `minItems` / `maxItems`.
- В `StringField` и `TextField` добавлена опция `notEmpty` для проверки пустой строки без запрета `null` и `undefined`.
- `DateTimeField` поддерживает `isArray`.

### Fixes

- Преобразования значений в `DateField`, `DateTimeField` и `DecimalNumberField` теперь выполняются для каждого элемента массива.
- В `StringField` регулярное выражение при `isArray: true` проверяется для каждого элемента массива.

### Removed

- Удалена опция `multiple` из `FileField` и `ImageField`.

## [5.2.1](https://github.com/steroids/nest/compare/5.2.0...5.2.1) (2026-08-25)

### Fixes

- Исправлена загрузка миграций на Windows: создание ленивых классов миграций больше не выполняется через генерацию JavaScript-кода, поэтому обратные слэши в путях к файлам обрабатываются корректно.

## [5.2.0](https://github.com/steroids/nest/compare/5.1.0...5.2.0) (2026-08-14)

### Features

- Field-декораторы получили единообразную поддержку пользовательских сообщений валидации. Добавлены options `isNotEmptyConstraintMessage`, `isBooleanConstraintMessage`, `isStringConstraintMessage`, `isEmailConstraintMessage`, `isFileConstraintMessage` и `isHhMmTimeConstraintMessage` для соответствующих validation constraints.
- `DateField` теперь позволяет переопределить сообщения `IsISO8601`, `MinDate` и `MaxDate`; для минимальной и максимальной даты поддерживаются как строки, так и callback-функции.
- Для `DecimalNumberField` добавлен отдельный публичный интерфейс `IDecimalNumberFieldOptions` с настройками точности, масштаба и сообщений валидации.

### Fixes

- `DataMapper` теперь вычисляет computable-поля при маппинге данных из БД и при других преобразованиях, кроме преобразования в БД.
- `SearchQuery.orderBy` и `addOrderBy` больше не оборачивают alias и поля в двойные кавычки, что исправляет ошибку `""model"" alias was not found` при сортировке с join и paginate.
- `IntegerField` и `TextField` теперь используют переданные пользовательские сообщения для ограничений `min` и `max`; для строковых ограничений добавлены корректные сообщения по умолчанию.
- Исправлено имя constraint в валидаторе `MaxDate`: ошибки максимальной даты теперь идентифицируются как `maxDate`, а не `minDate`.
- Из `UpdateTimeField` удалён лишний validation constraint `IsString`.

### Tests

- Добавлены unit-тесты Field-декораторов, проверяющие стандартные и пользовательские сообщения всех затронутых validation constraints.

## [5.1.0](https://github.com/steroids/nest/compare/5.0.3...5.1.0) (2026-08-11)

[Migration guide](docs/MigrationGuide.md#510-2026-08-11)

### Changed

- Добавлена одновременная поддержка NestJS 10 и NestJS 11 в `peerDependencies` для `@nestjs/cli`, `@nestjs/common`, `@nestjs/core` и `@nestjs/platform-express`; диапазон `@nestjs/swagger` обновлён до `^8.1.1 || ^11.0.0`.
- Среда разработки обновлена до NestJS 11, Swagger 11 и типов Express 5.
- `RestApplication` теперь создаёт `NestExpressApplication` и настраивает JSON и URL-encoded body parsers через `useBodyParser`, используя реализацию из установленного `@nestjs/platform-express`.
- `RestApplication` явно включает расширенный Express query parser, сохраняя поддержку вложенных query-параметров при использовании Express 5, где по умолчанию применяется упрощённый parser.
- `DataMapper.exportModels` больше не читает закрытые metadata-константы Swagger: `label` и `required` экспортируются непосредственно из options Field-декораторов.

### Removed

- Удалены прямые runtime-зависимости от `express` и `body-parser`. Версия Express и реализация body parser теперь определяются установленной версией `@nestjs/platform-express`: Express 4 для NestJS 10 и Express 5 для NestJS 11.
- Удалено использование закрытого импорта `@nestjs/swagger/dist/constants`, который недоступен в Swagger 11 через package exports.
- Упрощён интерфейс `IModule`: удалено неиспользуемое наследование от `ModuleMetadata`.

### Chores

- Обновлены runtime-зависимости `lodash` и `pg`, а также инструменты разработки: Jest, типы Node.js и Lodash, `ts-jest`, `ts-node` и `@steroidsjs/eslint-config`.
- Добавлена команда `yarn lint`, обновлена конфигурация ESLint и исправлены типы для совместимости с обновлёнными зависимостями, включая type-only импорты Express.

## [5.0.3](https://github.com/steroids/nest/compare/5.0.2...5.0.3) (2026-07-30)

### Fixed

- `migrate:generate` теперь создаёт миграции для entity из npm-пакетов в локальном модуле проекта, зарегистрированном через `ModuleHelper`, а не внутри соответствующей зависимости в `node_modules`.

## [5.0.2](https://github.com/steroids/nest/compare/5.0.1...5.0.2) (2026-07-30)

### Fixed

- `RelationField` теперь передаёт тип связи в Swagger через lazy resolver, предотвращая ошибку `A circular dependency has been detected` для двунаправленных связей.

## [5.0.1](https://github.com/steroids/nest/compare/5.0.0...5.0.1) (2026-07-23)

### Changed

- Генератор миграций разделён на независимые этапы получения schema diff, поиска файлов entity, планирования, рендеринга и записи миграций.
- Кастомный PostgreSQL query runner теперь использует штатную SQL-логику TypeORM и только добавляет к запросам информацию об объектах схемы.
- Миграции создаются в предсказуемом порядке: сначала объявления таблиц и views, затем внешние ключи, индексы и остальные изменения.
- Исходные файлы entity сначала определяются через загруженные модули, а при необходимости — через стандартную структуру Steroids-проекта.
- Импорты `MigrationInterface` и `QueryRunner` в сгенерированных миграциях переведены на `import type`.

### Fixed

- Исправлено получение текущего состояния таблиц и views: `migrate:generate` больше не генерирует создание всей схемы для уже существующей базы данных.
- Проверка неприменённых миграций выполняется без вывода полного списка уже применённых миграций.
- Исправлена ошибка `Unknown argument: migrate:generate`, возникавшая при поиске entity из-за обращения к getter-экспортам сторонних модулей.
- Добавлена корректная группировка изменений views, комментариев таблиц и операций, присутствующих только в `down`.
- Для нескольких миграций гарантируются уникальные timestamps и порядок, учитывающий зависимости между объектами схемы.
- Генератор заранее проверяет пути всех entity, не перезаписывает существующие миграции и удаляет уже созданные файлы при ошибке записи.

## [5.0.0](https://github.com/steroids/nest/compare/4.4.2...5.0.0) (2026-07-23)

[Migration guide](docs/MigrationGuide.md#500-2026-07-23)

### Changed

- Форки `@steroidsjs/typeorm` и `@steroidsjs/nest-typeorm` заменены на оригинальные пакеты `typeorm` и `@nestjs/typeorm`.
- Интеграция с TypeORM переведена с устаревшего API `Connection` на `DataSource`.
- Импорты TypeORM обновлены в исходном коде, CLI-командах, шаблонах генератора и документации.
- Миграции теперь создаются напрямую через конструктор класса, так как `getFromContainer` удалён из TypeORM 1.x.

### Fixed

- `glob` и `yargs`, которые ранее устанавливались транзитивно вместе с форками TypeORM, добавлены как явные зависимости.
- Загрузка миграций переведена с удалённого callback API `glob` на Promise API.

## [4.4.2](https://github.com/steroids/nest/compare/4.4.1...4.4.2) (2026-06-26)

[Migration guide](docs/MigrationGuide.md#442-2026-06-26)

### Fixes
- При включенном параметре `isListenLocalhost` теперь используется `127.0.0.1`, а не `localhost` ([#269](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/269))

### Removed
- Удалены `GracefulController` и `GracefulService` ([#271](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/271))
- УдаленS `RequestExecutionException` и `RequestExecutionExceptionFilter` ([#262](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/262))

## [4.4.1](https://github.com/steroids/nest/compare/4.4.0...4.4.1) (2026-05-27)

### Fixes
- Удален `postinstall` скрипт по очистке кэша jest, так как он ломал деплой в окружении без jest

## [4.4.0](https://github.com/steroids/nest/compare/4.3.0...4.4.0) (2026-05-14)

[Migration guide](docs/MigrationGuide.md#440-2026-05-14)

### Features
- Добавлена middleware `cookie-parser`, для удобной работы с куками (инициализируется в методе `RestApplication.initCookieParser`)
- Добавлено поле `IRestAppModuleConfig.cookieSecret` для возможности подписи кук
- `CreateDtoPipe` теперь принимает `itemMetatype` и умеет создавать DTO для элементов массива при локальном подключении pipe ([#180](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/180))

### Changed
- `DateTimeField` теперь по умолчанию сохраняет секунды при нормализации даты и времени. Для старого поведения нужно передать `skipSeconds: true`.
- Упорядочены options и metadata Field-декораторов: пользовательские options отделены от внутренних `appType`, `decoratorName` и `swaggerType`.
- Служебные хелперы для чтения metadata Field-декораторов вынесены в `fields/helpers/InternalFieldMetadataHelpers`.
- `RelationField` теперь сам определяет `isArray` по типу связи.

### Fixes
- `SearchQuery.orderBy` и `addOrderBy` теперь нормализуют поля сортировки, корректно обрабатывают alias, relation paths и поля, уже обернутые в двойные кавычки ([#210](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/210))

### Removed
- Из публичных options Field-декораторов удалены `jsType`, `dbType`, `plainName` и `hint`.
- Публичный `swaggerType` оставлен только в `ComputableField`, `JSONBField` и `GeometryField`.

### Chores
- Добавлен `postinstall`-скрипт для очистки Jest cache после установки зависимостей.

## [4.3.0](https://github.com/steroids/nest/compare/4.2.1...4.3.0) (2026-05-04)

### Features
- В `CrudService.save` при обновлении модели теперь подгружаются релейшены и для saveDto, которые не являются экземпляром класса со steroids fields ([#225](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/225))
- `DataMapper` теперь приводит одиночное значение к массиву для полей с опцией `isArray` ([#248](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/248))

### Fixes
- Исправлена настройка глобального префикса REST-приложения при включенном URI versioning ([#234](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/234))
- Sentry инициализируется только при наличии DSN, а `SentryExceptionFilter` подключается только при наличии клиента Sentry ([#254](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/254))
- Короткие алиасы `SearchQuery` теперь формируются через хеш пути связи, что предотвращает коллизии ([#228](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/2228))

### Deprecated
- `UserException` и `UserExceptionFilter` помечены как deprecated ([#233](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/233))

### Removed
- Удалена CLI-команда `migrate:generate-permissions` и вспомогательная логика генерации миграций по permissions ([#247](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/247))

### CI
- Добавлена GitHub Actions проверка заголовков pull request на соответствие conventional commits ([#178](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/178))

## [4.2.1](https://github.com/steroids/nest/compare/4.2.0...4.2.1) (2026-04-08)

### Fixes
- Параметр logger для метода NestFactory.create вынесен в конфиг как loggerLevels ([#241](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/241))
- Инициализация свойства RestApplication._app вынесена в метод createApp ([#241](https://gitlab.kozhindev.com/steroids/steroids-nest/-/work_items/241))

## [4.2.0](https://github.com/steroids/nest/compare/4.1.0...4.2.0) (2026-04-02)

[Migration guide](docs/MigrationGuide.md#420-2026-04-02)

### Features

- Переход с библиотеки `@ntegral/nestjs-sentry` на `@sentry/nestjs`
- Добавлена проверка сложности пароля в `PasswordField` ([#223](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/223))
- Добавлен параметр `isListenLocalhost` в `RestApplication` для прослушивания только localhost'а, env-переменная для него - `APP_LISTEN_LOCALHOST` ([#215](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/215))

### Fixes
- Фикс поведения UpdateTimeField (дубль подписки на BEFORE_INSERT заменен на BEFORE_UPDATE)

## [4.1.0](https://github.com/steroids/nest/compare/4.0.4...4.1.0) (2026-02-13)
## [4.0.4](https://github.com/steroids/nest/compare/4.0.3...4.0.4) (2026-02-09)

### Fixes
- Команда cli entity:generate теперь не пересоздает файлы сущностей если они уже есть в проекте
- Исправлены импорты в шаблонах используемых в команде cli entity:generate

### Features

- Добавлен флаг onlyReadService для команды cli entity:generate, при применении которого создается ReadService без лишних сущностей для CrudService

## [4.0.3](https://github.com/steroids/nest/compare/4.0.2...4.0.3) (2026-01-20)

### Features

- Добавлена проверка есть ли не примененные миграции при старте команды migrate:generate ([#171](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/171))
- В пайплайн выгрузки добавлен запуск тестов ([#197](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/197))
- Добавлена CLI команда ```migrate:generate-permissions``` для генерации миграций по добавлению новых пермишенов ([#156](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/156))
- Из текста ошибок, возвращаемых клиенту, по-умолчанию убрано подробное описание. Старое поведение включается по переменной окружение SENTRY_EXPOSE_ERROR_RESPONSE ([#129](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/129))
- Для ComputableField добавлен параметр swaggerType ([#201](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/201))

### Fixes
- Тесты в ModelTest.test приведены в актуальное состояние ([#197](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/197))
- Исправлена валидация чисел в DecimalField ([#204](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/204))

## [4.0.2](https://github.com/steroids/nest/compare/4.0.1...4.0.2) (2026-01-20)

### Fixes
- Исправлен тип openApi для EnumField - добавлено отображение параметра isArray

## [4.0.1](https://github.com/steroids/nest/compare/4.0.0...4.0.1) (2026-01-20)

### Features

- Добавлена возможность использовать регулярные выражения в декораторе StringField

### Fixes
- Исправлен тип openApi для EnumField - вместо ключей словаря отображаются значения

## [4.0.0](https://github.com/steroids/nest/compare/3.2.7...4.0.0) (2026-01-19)

[Migration guide](docs/MigrationGuide.md#400-2026-01-19)

### Features

- NestJS и связанные с ним зависимости обновлены до 10 версии и перенесены в peerDependencies

## [3.2.8](https://github.com/steroids/nest/compare/3.2.7...3.2.8) (2026-01-14)

### Fixes
- Исправлена валидация чисел в DecimalField

## [3.2.7](https://github.com/steroids/nest/compare/3.2.6...3.2.7) (2025-12-25)

### Features

- Добавлен ApiOkAutocompleteResponse декоратор 
- В параметры метода fillQueryFromSearchDto из ReadService добавлен context

### Fixes
- Исправлены типы openApi для EnumField и JSONBField

## [3.2.6](https://github.com/steroids/nest/compare/3.2.5...3.2.6) (2025-09-18)

### Features

- Добавлен AutoCompleteSearchUseCase с новой схемой ответа (selectedItems, items и total)
- В ReadService добавлен метод fillQueryFromSearchDto, отвечающий за заполнение searchQuery из searchDto, что позволяет не переопределять в проекте метод search

## [3.2.5](https://github.com/steroids/nest/compare/3.2.4...3.2.5) (2025-07-17)

### Features

-  Для команды migrate:revert добавлена поддержка параметра count - количество откатываемых миграций
- Поддержка параметра isArray для DecimalField, DecimalNumberField и IntegerField
- Для класса BaseEnum добавлен метод includesKey 

### Fixes

-  Исправлен интерфейс ISearchQueryConfig.onGetOne. SearchQuery.one теперь возвращает TModel | null

## [3.2.4](https://github.com/steroids/nest/compare/3.2.3...3.2.4) (2025-07-01)

### Fixes

-  Фикс перегрузки метода DataMapper.create

## [3.2.3](https://github.com/steroids/nest/compare/3.2.2...3.2.3) (2025-06-24)

### Features

-  Добавлена JSDoc документация ([#106](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/106))
-  EventEmitterModule по-умолчанию подключен в AppModule ([#122](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/122))

## [3.2.2](https://github.com/steroids/nest/compare/3.2.1...3.2.2) (2025-05-13)

### Features

-   Добавлен GeometryField

## [3.2.1](https://github.com/steroids/nest/compare/3.2.0...3.2.1) (2025-05-13)

### Bugfixes

-   Фикс поведения RelationField ([#14](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/14))

## [3.2.0](https://github.com/steroids/nest/compare/3.1.0...3.2.0) (2025-05-12)

### Features

-   Из *Field декораторов вынесен код TypeORM ([#9](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/9))
-   В ReadService и CrudRepository добавлен метод isExistsById ([#89](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/89))

## [3.1.0](https://github.com/steroids/nest/compare/3.0.3...3.1.0) (2025-03-13)

### Features

-   Добавлена поддержка кастомных валидаторов для класса ([#65](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/65))
-   В Swagger добавлена возможность аутентификации по JWT ([#96](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/96))

## [3.0.3](https://github.com/steroids/nest/compare/3.0.2...3.0.3) (2025-02-28)

[Migration guide](docs/MigrationGuide.md#303-2025-02-28)

### Bugfixes

-   Рефакторинг процесса сохранения модели ([#99](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/99))

## [3.0.2](https://github.com/steroids/nest/compare/3.0.1...3.0.2) (2025-02-19)

### Bugfixes

-   Комментарии теперь не вырезаются из исходного кода ([#98](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/98))

## [3.0.1](https://github.com/steroids/nest/compare/3.0.0...3.0.1) (2025-02-18)

### Bugfixes

-   Исправлен тип saveDto, передаваемой в методы create, update и save сервиса CrudService ([#46](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/46))
-   Исправлен тип, возвращаемый методом CrudService.create в случае, когда в него передан класс схемы ([#80](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/80))

## [3.0.0](https://github.com/steroids/nest/compare/2.2.1...3.0.0) (2025-02-18)

[Migration guide](docs/MigrationGuide.md#300-2025-02-18)

### Features

-   Добавлена Min Max валидация для DecimalNumberField ([#47](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/47))
-   Для сохранения модели в CrudService теперь используется diffModel (модель, содержащая только обновленные поля) ([#45](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/45))
-   Метод ModuleHelper.provide отмечен как deprecated ([#37](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/37))

### Bugfixes

-   Исправлено наследование мета-классов (классы, использующие *Field декораторы для описания полей) ([#6](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/6))
-   В Table классах репозитория имплементация интерфейса IDeepPartial заменена на наследование от соответствующих моделей ([#44](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/44))
-   Добавлен .eslintrc файл ([#87](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/87))
