# Экосистема фреймворка

Экосистема состоит из нескольких репозиториев:

## Основная библиотека

[**nest**](https://github.com/steroids/nest) (пакет в npm — `@steroidsjs/nest`) — включает в себя ключевые инструменты для начала работы с проектом, такие как базовый CRUD-сервис, валидация, декораторы полей для создания моделей, фильтры и пайпы для приложений на Nest, а также вспомогательные классы (например, `DataMapper`, `SearchQuery` и др.).

## Модульная система

[**nest-modules**](https://github.com/steroids/nest-modules) (пакет в npm — `@steroidsjs/nest-modules`) — пакет, содержащий интерфейсы модулей, описанных ниже, для их взаимной интеграции.

Модули:
- [**nest-auth**](https://github.com/steroids/nest-auth) (пакет в npm — `@steroidsjs/nest-auth`) — пакет с базовой реализацией модуля аутентификации и авторизации.
- [**nest-file**](https://github.com/steroids/nest-file) (пакет в npm — `@steroidsjs/nest-file`) — пакет с базовой реализацией модуля для работы с файлами.
- [**nest-notifier**](https://github.com/steroids/nest-notifier) (пакет в npm — `@steroidsjs/nest-notifier`) — пакет с базовой реализацией модуля для отправки уведомлений через различные каналы (SMS, звонки, push-уведомления, email).
- [**nest-user**](https://github.com/steroids/nest-user) (пакет в npm — `@steroidsjs/nest-user`) — пакет с базовой реализацией модуля работы с пользователями (регистрация, поиск и др.).

## Шаблон для создания нового проекта

[**boilerplate-nest**](https://github.com/steroids/boilerplate-nest) - базовое приложение NestJS на основе Steroids Nest
