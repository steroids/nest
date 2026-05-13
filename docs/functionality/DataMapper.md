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

Если у поля указана опция `isArray`, а во входных данных передано одиночное значение,
DataMapper приведет его к массиву:

```ts
class TagDto {
    @StringField()
    name: string;
}

class Dto {
    @RelationField({
        type: 'ManyToMany',
        isArray: true,
        relationClass: () => TagDto,
    })
    tags: TagDto[];
}

const dto = DataMapper.create(Dto, {
    tags: {
        name: 'important',
    },
});

console.log(dto.tags); // [TagDto { name: 'important' }]
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

## CreateDtoPipe

В REST-приложении `RestApplication` по умолчанию подключает глобальный `CreateDtoPipe`.
Он создает экземпляры DTO-классов из `body`, `query` и других параметров NestJS-контроллеров.
Для классов со steroids fields pipe использует `DataMapper`, поэтому при создании объекта применяются field-трансформации.

Для одиночного DTO дополнительная настройка не требуется:

```ts
@Post()
create(@Body() dto: StoreSaveDto) {
    // dto является экземпляром StoreSaveDto
}
```

Если в `body` передается массив объектов, тип элемента массива нужно указать явно в локальном pipe.
Это связано с тем, что TypeScript не сохраняет runtime-информацию о типе элементов `StoreSaveDto[]`,
и глобальный pipe видит только `Array`.

```ts
import {CreateDtoPipe} from '@steroidsjs/nest/infrastructure/pipes/CreateDtoPipe';

@Post('batch')
createMany(
    @Body(new CreateDtoPipe(StoreSaveDto))
    dtos: StoreSaveDto[],
) {
    // dtos является массивом StoreSaveDto[]
}
```

Глобальный `CreateDtoPipe` пропускает массив без изменений, если тип элемента не указан.
Поэтому локальный pipe получает исходный массив и создает DTO для каждого элемента.
