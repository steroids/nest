# Fields декораторы

Модель объявляется как класс с набором полей, каждый из которых имеет определенный Field декоратор, включающий в себя описание поля для TypeORM, class-validator, @nestjs/swagger и служебные декораторы @steroidsjs.

## Общие параметры

`BaseField` задает общий публичный набор параметров для Field-декораторов: `label`, `example`, `defaultValue`, `required`, `nullable`, `isArray`, `min`, `max`, `items`, `transform` и `noColumn`.

Служебные параметры `appType`, `decoratorName` и `swaggerType` не передаются в базовых пользовательских options. Их задают конкретные Field-декораторы во внутренних options, чтобы пользовательский API поля не зависел от технических деталей Swagger, TypeORM и steroids metadata.

Параметры `jsType`, `dbType`, `plainName` и `hint` не поддерживаются. Тип OpenAPI для большинства полей определяется самим Field-декоратором, а тип колонки базы данных задается TypeORM-слоем.

`swaggerType` можно передавать только там, где OpenAPI-представление не всегда следует из названия поля: `ComputableField`, `JSONBField` и `GeometryField`.

`RelationField` не принимает `isArray`: массивность определяется по типу связи. `ManyToMany` и `OneToMany` считаются массивами, `OneToOne` и `ManyToOne` - одиночными связями. `RelationIdField` по-прежнему принимает `isArray`, если id связи хранится массивом.

## Metadata

Для чтения metadata Field-декораторов используются helper-функции:

- `getFieldOptions(MetaClass, fieldName)` возвращает пользовательские options поля.
- `getFieldInternalOptions(MetaClass, fieldName)` возвращает внутренние options поля: `appType`, `decoratorName`, `swaggerType`.
- `getFieldAppType(MetaClass, fieldName)` возвращает steroids-тип поля.
- `getFieldDecoratorName(MetaClass, fieldName)` возвращает имя Field-декоратора.

Новая реализация этих helper-функций находится в `src/infrastructure/decorators/FieldMetadata.ts`. Экспорты из `BaseField` сохранены для совместимости.

## Список декораторов

Существуют следующие Field декораторы:

- `BaseField` - декоратор, содержащий базовый набор параметров для остальных декораторов.

- `BooleanField` - поле с булевым значением. Поддерживает параметры из BaseField, для данного поля настроен transform, преобразующий следующий набор значений к true:
    
    `true, 1, 'true', '1', 'y', 'yes', 'д', 'да'` 
    
- `ComputableField` - поле, значение которого высчитывается во время создания экземпляра класса при помощи DataMapper. Принимает параметр callback c интерфейсом `IComputableCallback`. Если OpenAPI-тип нельзя вывести автоматически, можно передать `swaggerType`. Пример использования:
    
    ```ts
    @ComputableField({
        requiredRelations: ['positions'],
        callback: (item) => item.item.positions?.length,
    })
    positionsCount: number;
    ```
    
- `CoordinateField` - поле для хранения координат. Хранится как дробь в строковом виде, для поля по-умолчанию заданы параметры precision=12 и scale=9
- `CreateTimeField` - поле, автоматически заполняющее время создания модели.
- `DateField` - поля для хранения даты. Для поля задан transform, преобразующий значения к ISO9075. Поддерживаются параметры валидации minDate и maxDate, в качестве которых можно передать string, Date и функцию, которая вернет нужное значение. Пример использования:
    
    ```ts
    @DateField({
        label: 'Дата рождения',
    		nullable: true,
        minDate: new Date(1920, 1, 1),
        maxDate: () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() - 14);
            return date;
        },
    })
    birthday: string;
    ```
    
- `DateTimeField` - поле для хранения даты и времени. Для поля задан transform, преобразующий значения к формату `yyyy-MM-dd HH:mm:ss`.
- `DecimalField` - поля для хранения дробных чисел. В коде такое числе представлено как string, для использования number см. DecimalNumberField. Поддерживает параметры scale (кол-во знаков после запятой, по-умолчанию 2) и precision (общее количество цифр в числе, по-умолчанию 10)
- `DecimalNumberField` - поля для хранения дробных чисел
- `DeleteDateField` - поле, хранящее время удаления записи в случае использования Soft Delete
- `EmailField` - поле для хранения email. Включает в себя валидацию на корректность указания email
- `EnumField` - поле для хранения значений из словарей. Словарь необходимо передать в параметре enum. Поддерживаются словари, наследованные от класса BaseEnum, а также массивы.
- `ExtendField` - поле, позволяющее объявить новое поле на основе конфигурации поля из другой модели. Частый пример использования - объявить поле в классе dto на основе аналогичного поля из модели. Первым аргументом принимает класс с базовым полем, вторым аргументом можно передать объект с параметрами, которые нужно переопределить.
    
    Также можно задать параметр sourceFieldName, если название поля в базовом классе отличается.
    
    Пример использования, в нём конфигурация для поля entityActionUid будет задана на основе поля uid из класса SyncMessageModel, кроме параметра nullable, который будет переопределен:
    
    ```ts
    @ExtendField(SyncMessageModel, {
        nullable: true,
        sourceFieldName: 'uid',
    })
    entityActionUid: string; 
    ```
    
- `FileField` - ???
- `HtmlField` - ??? (не совсем понимаю, зачем это поле нужно)
- `ImageField` - ???
- `IntegerField`  - поле для хранения целых чисел. Поддерживает валидацию по типу, минимальному и максимальному значению
- `JSONBField` - поле, позволяющее хранить JSON в двоичном формате. Поддерживается только в СУБД PostgreSQL. Записывать можно объекты, массивы или отдельные значения. Для OpenAPI-схемы можно передать `swaggerType`.
- `PasswordField` - ??? (не совсем понимаю, зачем это поле нужно)
- `PhoneField` - поле для хранения номера телефона. Включает в себя валидацию на корректность указания номера, а также transform, приводящий номера к единому формату
- `PrimaryKeyField` - поле для первичного ключа (id)
- `RelationField`  - поле, позволяющее указывать связи между моделями. Поддерживаются типы связей `OneToOne`, `ManyToMany`, `OneToMany` и `ManyToOne`. Параметр `isArray` задавать не нужно: он определяется по типу связи.
- `RelationIdField` - поле с внешним ключом для связей с типом `OneToOne` и `ManyToOne`. Если поле хранит массив id, нужно явно передать `isArray: true`.
- `StringField` - поле для хранения строк. Поддерживается валидация длины строки
- `TextField` - поле для хранения длинных строк. Поддерживается валидация длины строки
- `TimeField` - поле для хранения времени в формате HH:mm
- `UidField` - поле для хранения и генерации uid
- `UpdateTimeField` - поле, автоматически заполняющее время последнего обновления модели.
- `GeometryField` - поле для хранения геометрии. Для OpenAPI-схемы можно передать `swaggerType`.
