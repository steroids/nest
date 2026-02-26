# Steroids Nest Core - документация

## 1. Обзор

- [Что такое и для чего нужен Steroids Nest](overview/Review.md#обзор)
- [Описание компонентов](overview/Components.md)
- [Архитектура проекта](overview/ProjectArchitecture.md)
- [Экосистема фреймворка](overview/FrameworkEcosystem.md)
		
## 2. Использование
- [быстрый старт и подключение библиотеки](usage/Start.md)
- [дебаг фреймворка в проекте](usage/Debug.md)
- [запуск миграций](usage/Migration.md)
- [запуск и конфигурация приложения](usage/LaunchAndConfig.md)

## 3. Функциональность

- [работа с CRUD (CrudService, CrudRepository)](functionality/Crud.md)
- [расширенный поиск в БД (SearchQuery)](functionality/SearchQuery.md)
- [создание экземпляров классов - DTO, модели (DataMapper)](functionality/DataMapper.md)
- [валидация (ValidationHelper, ...)](functionality/Validation.md)
- [задание правил для полей (*Field декораторы)](functionality/FieldsDecorators.md)

## 4. Модули

- [описание модулей](modules/Modules.md)
- [расширение модулей](modules/Modules.md)
- подключение модулей - в README.md каждого модуля
- использование ситуативных модулей
    - [EventEmitterModule](modules/Events.md)
    - [Transactional TypeOrmModule](modules/Transactions.md)
    - LoggerModule
    - I18nModule
