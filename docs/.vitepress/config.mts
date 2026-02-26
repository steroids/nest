export default {
    title: 'Steroids Nest',
    description: 'Библиотека инструментов и утилит для NestJS',
    lang: 'ru',
    srcExclude: ['**/MigrationGuide.md'],

    themeConfig: {
        nav: [
            { text: 'Документация', link: '/overview/Review' },
            { text: 'GitHub', link: 'https://github.com/steroids/nest' },
        ],

        sidebar: [
            {
                text: 'Обзор',
                items: [
                    { text: 'Что такое Steroids Nest', link: '/overview/Review' },
                    { text: 'Описание компонентов', link: '/overview/Components' },
                    { text: 'Архитектура проекта', link: '/overview/ProjectArchitecture' },
                    { text: 'Экосистема фреймворка', link: '/overview/FrameworkEcosystem' },
                ],
            },
            {
                text: 'Использование',
                items: [
                    { text: 'Быстрый старт', link: '/usage/Start' },
                    { text: 'Дебаг', link: '/usage/Debug' },
                    { text: 'Миграции', link: '/usage/Migration' },
                    { text: 'Запуск и конфигурация', link: '/usage/LaunchAndConfig' },
                ],
            },
            {
                text: 'Функциональность',
                items: [
                    { text: 'CRUD', link: '/functionality/Crud' },
                    { text: 'SearchQuery', link: '/functionality/SearchQuery' },
                    { text: 'DataMapper', link: '/functionality/DataMapper' },
                    { text: 'Валидация', link: '/functionality/Validation' },
                    { text: 'Field декораторы', link: '/functionality/FieldsDecorators' },
                ],
            },
            {
                text: 'Модули',
                items: [
                    { text: 'Описание модулей', link: '/modules/Modules' },
                    { text: 'Расширение модулей', link: '/modules/Extension' },
                    { text: 'EventEmitterModule', link: '/modules/Events' },
                    { text: 'Транзакции TypeORM', link: '/modules/Transactions' },
                ],
            },
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/steroids/nest' },
        ],
    },
}
