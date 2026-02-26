<!-- VitePress landing page. For navigation use the sidebar or see README.md. -->
---
layout: home

hero:
  name: Steroids Nest
  text: Библиотека утилит для NestJS
  tagline: Готовые решения для CRUD, поиска, валидации и работы с данными — чтобы вы сфокусировались на логике приложения.
  actions:
    - theme: brand
      text: Быстрый старт
      link: /usage/Start
    - theme: alt
      text: Обзор
      link: /overview/Review

features:
  - title: CRUD из коробки
    details: CrudService и CrudRepository ускоряют реализацию операций создания, чтения, обновления и удаления.
  - title: Расширенный поиск
    details: SearchQuery реализует гибкие запросы к БД через архитектуру билдера.
  - title: Field декораторы
    details: Описывают типы, ограничения и валидационные правила полей для сериализации, валидации и генерации схемы БД.
  - title: DataMapper
    details: Создаёт экземпляры классов (DTO, модели) с учётом их метаданных.
---
