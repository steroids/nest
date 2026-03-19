# DataMapper

DataMapper - класс, позволяющий создать экземпляр нужного класса с учетом мета информации, заложенной с помощью Fields декораторов. Пример:

```typescript
DataMapper.create(StoreStatusChangeEventDto, {
    storeId: nextModel.id,
    storeExternalId: nextModel.externalId,
    status: nextModel.status,
});
```

DataMapper создает также экземпляры вложенных классов, если поля с их типом имеют RelationField декоратор:

```ts
class Dto2 {
    @StringField()
    name: string;
}

class Dto1 {
    @IntegerField()
    id: number;

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => Dto2,
    })
    dto2: Dto2;
}

const dto = DataMapper.create(Dto1, {
    id: 1,
    dto2: {
        name: 'some string',
    },
});

console.log(dto); // Dto1 { id: 1, dto2: Dto2 { name: 'some string' } }
```

При создании объекта DataMapper высчитывает значения в ComputableField полях:

```ts
class Dto {
    @StringField()
    name: string;

    @StringField()
    surname: string;

    @StringField()
    patronymic: string;

    @ComputableField({
        callback: (event) => [
            event.item.surname,
            event.item.name,
            event.item.patronymic,
        ].join(' '),
    })
    fullName: string;
}

const dto = DataMapper.create(Dto, {
    name: 'Михаил',
    surname: 'Зубенко',
    patronymic: 'Петрович',
});

console.log(dto);
//Dto {
//  name: 'Михаил',
//  surname: 'Зубенко',
//  patronymic: 'Петрович',
//  fullName: 'Зубенко Михаил Петрович'
//}
```
