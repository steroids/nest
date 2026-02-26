# Валидация и ValidationHelper

Валидация объектов работает при помощи класса `ValidationHelper`.

Валидировать можно экземпляр любого класса, в котором поля имеют *Field декораторы из основного пакета, а также декораторы из `class-validator`.

Field декораторы поддерживают базовый набор правил валидации из class-validator (например, min и max для IntegerField. Более подробно см. описание [Fields декораторов](FieldsDecorators.md)).

Для валидации объекта необходимо вызывать функцию `ValidationHelper.validate`:

```ts
public async createOrder(dto: OrderConstructorDto, context: ContextDto) {
    await ValidationHelper.validate(dto);
}
```

### Кастомные валидаторы

Также поддерживаются кастомные валидаторы, которые можно добавить с помощью декоратора `Validator`. Данный декоратор может принимать анонимные функции:

```ts
@IntegerField({
	label: 'ID предложения о доставке',
	nullable: true,
})
@Validator((dto: SiteOrderDto) => {
    if (dto.shipmentMethod === OrderShipmentMethodEnum.BY_DELIVERY && !dto.deliveryOfferId) {
        throw new FieldValidatorException(
            `Не может быть пустым для типа доставки "${dto.shipmentMethod}"`,
        );
    }
})
deliveryOfferId: number;
```

Такая функция принимает 2 аргумента - проверяемый сейчас объект и объект params, включающий в себя следующие параметры:

- name - ключ поля, над которым объявлен декоратор `Validator`
- context - `ContextDto` с информацией о текущей сессии
- prevModel - текущая версия объекта из базы данных (данный параметр передается в `CrudService` при сохранении записи)
- nextModel  - версия объекта, которую планируется записать в базу данных (данный параметр передается в `CrudService` при сохранении записи)
- params - дополнительные параметры валидации, которые можно передать при вызове `ValidationHelper`

Также декоратор `Validator` может принимать экземпляр сервиса, который имплементирует интерфейс `IValidator`:

```ts
export class StoreExternalIdValidator implements IValidator {
    constructor(
        private readonly storeRepository: IStoreRepository,
    ) {}

    async validate(dto: StoreSaveDto, params?: IValidatorParams) {
        if (!dto.externalId) {
            return;
        }
        const existingStore = await this.storeRepository.createQuery()
            .where({
                externalId: dto.externalId,
            })
            .andWhere(['not =', 'id', dto.id])
            .one();

        if (existingStore) {
            throw new FieldValidatorException('Магазин с таким ID уже зарегистрирован');
        }
    }
} 
```

В таком случае в сервис валидации можно подключить внешние сервисы и достать нужные для валидации данные.

Полный пример использования кастомного класса валидации выглядит так:

1. Объявляем класс, имплементирующий интерфейс `IValidator`:
    
    ```ts
    export class SomeValidator implements IValidator {
        constructor() {}
    
    	async validate(dto: SomeDtoClass, params?: IValidatorParams) {
        throw new FieldValidatorException('Some error!')
      }
    }
    ```
    
2. Передаем этот класс в декоратор `Validator` над нужным полем класса:
    
    ```ts
    export class SomeDtoClass {
        @IntegerField()
        @Validator(SomeValidator)
        id: number;
    }
    ```
    
3. Подключаем класс валидации в модуль проекта и передаем его в качестве зависимости в сервис, где планируется валидировать объект:
    
    ```ts
    @Module({
        tables: ModuleHelper.importDir(join(__dirname, '/tables')),
        permissions,
        module: () => ({
            imports: [],
            providers: [
    		        // Подключаем валидатор
                ModuleHelper.provide(SomeValidator, []),
                // Передаем его в сервис в виде массива валидоров
                ModuleHelper.provide(SomeService, [
                    [SomeValidator],
                ]),
            ],
            exports: [],
        }),
    })
    export class SomeModule {}
    ```
    
4. В сервисе вызываем `ValidationHelper.validate`, передав в качестве третьего аргумента массив валидаторов, полученных в конструкторе
    
    ```ts
    export class SomeService {
        constructor(
            private readonly validators: IValidator[],
        ) {}
    
        public async handle(dto: SomeDtoClass, context: ContextDto) {
    	    await ValidationHelper.validate(dto, {context}, this.validators); 
        }
    }
    ```
    

Вызов функции `ValidationHelper.validate` выбросит исключение `ValidationException` в случае, если валидация не пройдена. `ValidationException` содержит объект ошибок типа `IErrorsCompositeObject`.

Также можно вызвать функции `*getClassValidatorErrors` и `getSteroidsErrors`.*

Данные функции не выбросят исключение, а вернут объект указанного выше типа с ошибками из class-validator и кастомных валидаторов соответственно.
