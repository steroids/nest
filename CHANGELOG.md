# Steroids Nest Changelog

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

[Migration guide](docs/MigrationGuide.md#303-2024-02-28)

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

[Migration guide](docs/MigrationGuide.md#300-2024-02-18)

### Features

-   Добавлена Min Max валидация для DecimalNumberField ([#47](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/47))
-   Для сохранения модели в CrudService теперь используется diffModel (модель, содержащая только обновленные поля) ([#45](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/45))
-   Метод ModuleHelper.provide отмечен как deprecated ([#37](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/37))

### Bugfixes

-   Исправлено наследование мета-классов (классы, использующие *Field декораторы для описания полей) ([#6](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/6))
-   В Table классах репозитория имплементация интерфейса IDeepPartial заменена на наследование от соответствующих моделей ([#44](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/44))
-   Добавлен .eslintrc файл ([#87](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/87))
