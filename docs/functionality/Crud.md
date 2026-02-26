# Работа с CRUD

Для быстрой реализации CRUD операций с моделью
в Steroids используются `CrudRepository`, `ReadService` и `CrudService`.

## CrudRepository

`CrudRepository` — это обобщенный класс репозитория для работы с базой данных, использующий TypeORM.
Он реализует CRUD-операции (создание, чтение, обновление, удаление), 
предоставляя унифицированный интерфейс для работы с любыми моделями.

### Начало работы

Для создания репозитория конкретной модели нужно создать класс, который будет наследовать `CrudRepository<TModel>`,
где `TModel` - класс нужной модели.
`CrudRepository` реализует интерфейс `ICrudRepository`.

```typescript
import {Repository} from '@steroidsjs/typeorm';
import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@steroidsjs/nest-typeorm';
import {CrudRepository} from '@steroidsjs/nest/infrastructure/repositories/CrudRepository';
import {UserModel} from '../models/UserModel';
import {IUserRepository} from '../interfaces/IUserRepository';
import {UserTable} from '../tables/UserTable';

export interface IUserRepository extends ICrudRepository<UserModel> {}

@Injectable()
export class UserRepository extends CrudRepository<UserModel> implements IUserRepository {
    protected modelClass = UserModel;

    constructor(
        @InjectRepository(UserTable)
        public dbRepository: Repository<UserTable>,
    ) {
        super();
    }
}
```

```typescript
import {ICrudRepository} from '@steroidsjs/nest/usecases/interfaces/ICrudRepository';
import {UserModel} from '../models/UserModel';

export interface IUserRepository extends ICrudRepository<UserModel> {}
```

### Свойства

---

`primaryKey`

По умолчанию: `id`. Определяет имя первичного ключа таблицы.

`dbRepository`

Экземпляр репозитория TypeORM, привязанного к конкретной ORM-сущности.

`modelClass`

Класс модели для CRUD операций (такой же, как `TModel`).


### Методы

---
```typescript
init(dbRepository: Repository<any>, modelClass: any): void
```

Сеттер для `dbRepository` и `modelClass`.

```typescript
async save(model: TModel, transactionHandler?: (callback) => Promise<void>): Promise<TModel>
```

Создание или обновление записи; [transactionHandler](#transaction-handler).

```typescript
async remove(id: number, transactionHandler?: (callback) => Promise<void>): Promise<void>
```

Удаление запись по `id`; [transactionHandler](#transaction-handler).

```typescript
async softRemove(id: number, transactionHandler?: (callback: () => Promise<void>) => Promise<void>): Promise<void>`
```

[Мягкое удаление](#soft-remove) модели по `id`, метод будет работать,
только если у модели есть поле, помеченное декоратором `DeleteDateField`; [transactionHandler](#transaction-handler).

```typescript
async search(dto: SearchInputDto, searchQuery: SearchQuery<TModel>): Promise<SearchResultDto<TModel>>
```

Поиск с учетом фильтров, сортировки и пагинации.

```typescript
async findOne(conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading = true): Promise<TModel | null>
```

Поиск одной записи по условию (`ICondition`) или по [SearchQuery](SearchQuery.md).

```typescript
async findMany(conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading = true): Promise<TModel[]>
```

Поиск нескольких записей по условию (`ICondition`) или по [SearchQuery](SearchQuery.md). 


```typescript
createQuery(config?: ISearchQueryConfig<TModel>): SearchQuery<TModel>
```

Создание объекта [SearchQuery](SearchQuery.md) в контексте репозитория,
что позволяет вызывать методы `one`, `many` у [SearchQuery](SearchQuery.md)
(связывание с методами `findOne` и `findMany`).

```typescript
protected createQueryBuilder(conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading: boolean = true): [SelectQueryBuilder<any>, SearchQuery<TModel>]
```

Создание билдера запросов по условию (`ICondition`) или по [SearchQuery](SearchQuery.md) для методов `findOne()` и `findMany()`.

```typescript
async saveInternal(manager: ISaveManager, nextModel: TModel): Promise<void>
```

[Внутренний метод](#internal-methods) сохранения, который можно переопределять. Используется внутри метода `save`.

```typescript
async removeInternal(manager: EntityManager, id: number): Promise<void>
```

[Внутренний метод](#internal-methods) удаления, который можно переопределять. Используется внутри метода `remove`.

```typescript
async softRemoveInternal(manager: EntityManager, id: number): Promise<void>
```

[Внутренний метод](#internal-methods) [мягкого удаления](#soft-remove), который можно переопределять. Используется внутри метода `softRemove`.


```typescript
protected modelToEntity(model): any
```

Преобразование модели в класс ORM-сущности.

```typescript
protected entityToModel(obj: any): TModel
```

Преобразование объекта класса ORM-сущности в модель. 
Выбрасывается исключение (`Property modelClass is not set in repository: <repositoryName>`),
если `modelClass` не установлен.

## ReadService

`ReadService` - обобщенный класс сервиса для работы с данными,
предоставляющий методы поиска моделей с поддержкой фильтрации и пагинации.

### Начало работы

Для создания класса сервиса операций чтения конкретной модели 
нужно создать класс, который будет наследовать `ReadService<TModel, TSearchDto>`, где `TModel` - класс нужной модели,
`TSearchDto` - класс, наследующий `SearchInputDto` или реализующий `ISearchInputDto`, для использования в методе `search`
(по умолчанию используется `ISearchInputDto`).

Подходит для работы с иммутабельными моделями с заранее заполненными данными в хранилище.

```typescript
import {ReadService} from '@steroidsjs/nest/usecases/services/ReadService';
import {FileModel} from '../models/FileModel';
import {FileSearchDto} from '../dtos/FileSearchDto';
import {IFileRepository} from '../interfaces/IFileRepository';

export class FileService extends ReadService<FileModel, FileSearchDto> {
    protected modelClass = FileModel;

    constructor(
        public repository: IFileRepository,
    ) {
        super();
    }
}
```

### Свойства

---

`primaryKey`

По умолчанию: `id`. Определяет имя первичного ключа таблицы.

`repository`

Экземпляр класса, реализующего `ICrudRepository<TModel>`.

`modelClass`

Класс модели для операций чтения такой же, как `TModel`.

`validators`

Список экземпляров классов, реализующих интерфейс `IValidator`, для валидации 
объектов с помощью [ValidationHelper](Validation.md).

### Методы

---

```typescript
init(repository: ICrudRepository<TModel>, ModelClass: IType<TModel>): void
 ```

Сеттер для `repository` и `modelClass`.

```typescript
async search<TSchema>(dto: TSearchDto, context: ContextDto = null, schemaClass: IType<TSchema> = null): Promise<SearchResultDto<TModel | TSchema>>
 ```

Поиск моделей с учетом сортировки и пагинации. 
Переданное dto валидируется.
Результат преобразуется в указанную схему (`schemaClass`), если она предоставлена.

```typescript
async findById<TSchema>(id: number | string, context: ContextDto = null, schemaClass: IType<TSchema> = null): Promise<TModel | TSchema>
```

Поиск модель по ее идентификатору.
Результат преобразуется в указанную схему (`schemaClass`), если она предоставлена.

```typescript
async findOne(searchQuery: SearchQuery<TModel>): Promise<TModel>
```

Поиск одной модели, соответствующей переданному запросу ([SearchQuery](SearchQuery.md)).

```typescript
async findMany(searchQuery: SearchQuery<TModel>): Promise<TModel[]>
```

Поиск нескольких моделей, соответствующих переданному запросу ([SearchQuery](SearchQuery.md)).

```typescript
createQuery(config?: ISearchQueryConfig<TModel>): SearchQuery<TModel>
```
Создание объекта [SearchQuery](SearchQuery.md) в контексте репозитория,
что позволяет вызывать методы `one`, `many` у [SearchQuery](SearchQuery.md) (связывание с методами `findOne` и `findMany`).

```typescript
protected modelToSchema<TSchema>(model: TModel, schemaClass: IType<TSchema>): TSchema
```

Преобразование модели в указанный класс схемы (`schemaClass`) с использованием `DataMapper`.

```typescript
protected async validate(dto: any, params?: IValidatorParams)
```

Валидация dto с помощью зарегистрированных валидаторов (`validators`).

## CrudService

`CrudService` - обобщённый класс сервиса для работы с CRUD операциями.
Этот класс наследует функциональность от `ReadService`,
добавляя методы для создания, обновления и удаления записей.

### Начало работы

Начало работы с `CrudService` мало чем отличается от `ReadService`.

Для создания класса сервиса CRUD операций конкретной модели
нужно создать класс, который будет наследовать `CrudService<TModel, TSearchDto>`, где `TModel` - класс нужной модели,
`TSearchDto` - класс, наследующий `SearchInputDto` или реализующий `ISearchInputDto`, для использования в методе `search`
(по умолчанию используется `ISearchInputDto`).

Подходит для работы с мутабельными моделями.

```typescript
import {CrudService} from '@steroidsjs/nest/usecases/services/CrudService';
import {UserModel} from '../models/UserModel';
import {UserSearchDto} from '../dtos/UserSearchDto';
import {IUserRepository} from '../interfaces/IUserRepository';

export class UserService extends CrudService<UserModel, UserSearchDto> {
    protected modelClass = UserModel;

    constructor(
        public repository: IUserRepository,
    ) {
        super();
    }
}
```

### Свойства

---

`CrudService` наследует свойства от `ReadService`.

### Методы

---

`CrudService` расширяет возможности `ReadService`, добавляя собственные методы.

```typescript
async save<TSchema>(rawId: number | string | null, dto: Partial<TModel>, context: ContextDto = null, schemaClass: IType<TSchema> = null): Promise<TModel | TSchema>
```

Универсальный метод, объединяющий логику создания и обновления.
Если `id` указан, ищет существующую модель и применяет изменения.
Перед сохранением валидирует переданное dto и модель с применёнными изменениями.
Преобразует результат в указанную схему (`schemaClass`), если она предоставлена.

```typescript
async create<TSchema>(dto: Partial<TModel>, context: ContextDto = null, schemaClass: IType<TSchema> = null): Promise<TModel | TSchema> 
```

Создание модели. Использует метод `save` без переданного `id`.

```typescript
async update<TSchema>(rawId: number | string, dto: Partial<TModel>, context: ContextDto = null, schemaClass: IType<TSchema> = null): Promise<TModel | TSchema>
```

Обновление модели. Использует метод `save` с переданным `id`.

```typescript
async saveInternal(prevModel: TModel | null, nextModel: TModel, context?: ContextDto): Promise<void>
```

[Внутренний метод](#internal-methods) сохранения, который можно переопределять. Используется внутри метода `save`.

```typescript
async remove(rawId: number | string, context: ContextDto = null): Promise<void> 
```

Удаление модели по `id`.
Перед удалением проверяется наличие связанных моделей.

```typescript
async checkHasRelatedModels(id: string | number, service: CrudService<any>): Promise<void>
```

Проверка наличия связанных элементов у модели, используется внутри метода `remove`.
Выбрасывается исключение (`Нельзя удалить, есть связные элементы (<relation>)`), если удаление невозможно из-за связей.

```typescript
async removeInternal(id: number, context?: ContextDto): Promise<void>
```

[Внутренний метод](#internal-methods) удаления, который можно переопределять. Используется внутри метода `remove`.

```typescript
async softRemove(rawId: number | string, context: ContextDto = null): Promise<void>
```

[Мягкое удаление](#soft-remove) модели по `id`.

```typescript
async softRemoveInternal(id: number, context?: ContextDto): Promise<void>
```

[Внутренний метод](#internal-methods) [мягкого удаления](#soft-remove), который можно переопределять.
Используется внутри метода `softRemove`.

```typescript
protected dtoToModel(dto: Partial<TModel>): TModel
```

Преобразование dto в модель.
Использует `DataMapper` для копирования значений.
Выбрасывается исключение (`Property modelClass is not set in service: <serviceName>`),
если `modelClass` не установлен.

---

### Общие пояснения

#### 1. transactionHandler

`transactionHandler?: (callback: () => Promise<void>` - функция, декорирующая функцию удаления, мягкого удаления или сохранения
(в зависимости от функции) внутри транзакции.
Если передается `transactionHandler`, то операции, выполняемые в `callback`, происходят в транзакции.
Пример такой функции:
```typescript
const transactionHandler = async (callback) => {
    console.log('Start operation');
    await callback();
    console.log('End operation');
}
```

#### 2. Мягкое удаление

Мягкое удаление - подход, при котором данные не удаляются физически из базы данных,
а помечаются как удалённые. Время удаления записи в поле с декоратором `DeleteDateField`
служит такой отметкой.

#### 3. Внутренние методы

Внутренние методы представляют собой выполнение одного действия
(удаление, мягкое удаление или сохранение)
и нужны для переопределения логики в проекте.
Такой подход делает код гибким и удобным для расширения.

Например, если требуется дополнить логику сохранения (метод `save` класса `CrudService`)
без её полной замены, можно переопределить внутренний метод сохранения (`saveInternal`) этого класса.

```typescript
import {CrudService} from '@steroidsjs/nest/usecases/services/CrudService';
import {DataMapper} from '@steroidsjs/nest/usecases/helpers/DataMapper';
import {DeliveryClaimModel} from '../models/DeliveryClaimModel';
import {DeliveryClaimSearchDto} from '../dtos/deliveryClaim/DeliveryClaimSearchDto';
import {DeliveryClaimSaveDto} from '../dtos/deliveryClaim/DeliveryClaimSaveDto';
import {IDeliveryClaimRepository} from '../interfaces/IDeliveryClaimRepository';
import {ContextDto} from '../../../auth/domain/dtos/ContextDto';
import {IEventEmitter} from '../../../base/domain/interfaces/IEventEmitter';
import {DeliveryClaimStatusChangeEventDto} from '../dtos/deliveryClaim/events/DeliveryClaimStatusChangeEventDto';

export class DeliveryClaimService extends CrudService<DeliveryClaimModel, DeliveryClaimSearchDto, DeliveryClaimSaveDto> {
    protected modelClass = DeliveryClaimModel;

    constructor(
        /** DeliveryClaimRepository */
        protected readonly repository: IDeliveryClaimRepository,
        protected readonly eventEmitterService: IEventEmitter,
    ) {
        super();
    }

    async saveInternal(prevModel: DeliveryClaimModel | null, nextModel: DeliveryClaimModel, context?: ContextDto) {
        const statusChanged = prevModel?.status !== nextModel.status;

        await this.repository.save(nextModel);

        if (!prevModel || statusChanged) {
            this.eventEmitterService.emit(
                DeliveryClaimStatusChangeEventDto.eventName,
                DataMapper.create(DeliveryClaimStatusChangeEventDto, {
                    claimId: nextModel.id,
                    claimExternalId: nextModel.externalId,
                    orderId: nextModel.orderId,
                    oldStatus: prevModel?.status,
                    newStatus: nextModel.status,
                    provider: nextModel.provider,
                }),
            );
        }
    }
}
```

