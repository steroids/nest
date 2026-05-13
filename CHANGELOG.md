# Steroids Nest Changelog

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

- Добавлена middleware `cookie-parser`, для удобной работы с куками (инициализируется в методе `RestApplication.initCookieParser`)
- Добавлено поле `IRestAppModuleConfig.cookieSecret` для возможности подписи кук
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
