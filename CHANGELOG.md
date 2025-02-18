# Steroids Nest Changelog

## [3.0.1](https://github.com/steroids/nest/compare/3.0.0...3.0.1) (2024-02-18)

### Bugfixes

-   Исправлен тип saveDto, передаваемой в методы create, update и save сервиса CrudService ([#46](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/46)
-   Исправлен тип, возвращаемый методом CrudService.create в случае, когда в него передан класс схемы ([#80](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/80))

## [3.0.0](https://github.com/steroids/nest/compare/2.2.1...3.0.0) (2024-02-18)

### Features

-   Добавлена Min Max валидация для DecimalNumberField ([#47](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/47))
-   Для сохранения модели в CrudService теперь используется diffModel (модель, содержащая только обновленные поля) ([#45](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/45))
-   Метод ModuleHelper.provide отмечен как deprecated ([#37](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/37))

### Bugfixes

-   Исправлено наследование мета-классов (классы, использующие *Field декораторы для описания полей) ([#6](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/6))
-   В Table классах репозитория имплементация интерфейса IDeepPartial заменена на наследование от соответствующих моделей ([#44](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/44))
-   Добавлен .eslintrc файл ([#87](https://gitlab.kozhindev.com/steroids/steroids-nest/-/issues/87))
