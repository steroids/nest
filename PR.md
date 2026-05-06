# Описание

- Удалены публичные параметры `jsType` и `dbType` из Field-декораторов.
- Удалены неиспользуемые параметры `plainName` и `hint`.
- Внутренние Swagger-типы переведены на `swaggerType`.
- Публичный `swaggerType` оставлен только для полей, где OpenAPI-тип нельзя однозначно вывести из названия декоратора: `ComputableField`, `JSONBField` и `GeometryField`.
- `appType` оставлен как внутренняя мета-информация поля, которую передаёт каждый конкретный Field-декоратор, без добавления в `IBaseFieldOptions`.
- Внешние переопределения `dbType` убраны из TypeORM Field API; типы колонок теперь остаются ответственностью TypeORM-слоя.
- Хелперы для работы с metadata вынесены из `BaseField` в `src/infrastructure/decorators/FieldMetadata.ts`.
- Для `RelationField` удалён пользовательский `isArray`: массивность теперь вычисляется только из типа связи.
- Metadata разделена на пользовательские options и internal options: `STEROIDS_META_FIELD_OPTIONS` и `STEROIDS_META_FIELD_INTERNAL_OPTIONS`.

# Детали

`BaseField` теперь имеет более узкий публичный набор параметров. Он больше не принимает JavaScript-тип или тип базы данных для каждого Field-декоратора. Конкретные Field-декораторы сами передают во внутренние параметры `BaseField` свой `appType` и дефолтный Swagger-тип.

`getFieldOptions` теперь возвращает только пользовательские options поля. Служебные параметры `appType`, `decoratorName` и `swaggerType` хранятся отдельно и доступны через `getFieldInternalOptions`, `getFieldAppType` и `getFieldDecoratorName`.

`ComputableField`, `JSONBField` и `GeometryField` всё ещё позволяют передавать `swaggerType`, потому что их OpenAPI-представление может быть неоднозначным или зависеть от проекта.

`BaseField` больше не содержит relation/meta helper-логику. Для обратной совместимости старые экспорты из `BaseField` сохранены и реэкспортируют функции из `src/infrastructure/decorators/FieldMetadata.ts`.

`IFieldInternalOptions` больше не содержит `isArray`. Для обычных полей единственным источником остаётся `IBaseFieldOptions.isArray`, а `RelationField` сам заполняет `isArray` в пользовательские options на основе `ManyToMany` и `OneToMany`.

`RelationIdField` не меняет публичное поведение по `isArray`: если поле id связи хранит массив значений, параметр по-прежнему нужно передавать явно.

`TypeOrmDecoratorFactory` типизирован через `IFieldOptions`, без расширения сигнатур до `any`.

# Документация

- Добавлен задел по обновлению Field-декораторов в `docs/MigrationGuide.md`.
- Добавлена краткая запись о патче в `CHANGELOG.md`.
- Обновлена страница `docs/functionality/FieldsDecorators.md` с актуальным описанием публичных и внутренних options.

# Проверка

- `yarn build`
- `yarn test-unit --runInBand`
