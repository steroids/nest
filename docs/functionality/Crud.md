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

### Функциональность

Этот класс реализует функциональность управления ORM-сущностями.
Он позволяет инициализировать TypeORM-репозиторий, а также выполнять основные операции:
чтение, создание, обновление, удаление и [мягкое удаление](Crud.md#2-мягкое-удаление) записей.
Для поиска данных реализованы методы, поддерживающие фильтрацию, сортировку и пагинацию,
а также возможность получения одной или нескольких записей по условиям.

[Внутренние методы](Crud.md#3-внутренние-методы) сохранения и удаления могут быть переопределены.

Также класс содержит методы для преобразования моделей в ORM-сущности и обратно,
обеспечивая соответствие между структурой базы данных и бизнес-логикой.


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

### Функциональность

Этот класс управляет взаимодействием с репозиторием и моделями, обеспечивая их поиск.
Поиск может осуществляться по идентификатору, с использованием фильтров, сортировки и пагинации,
а также через специализированные поисковые запросы ([SearchQuery](SearchQuery.md)).

Результаты поиска могут быть преобразованы в указанный класс схемы (schemaClass).
Для работы с запросами предусмотрен метод создания [SearchQuery](SearchQuery.md), который связывается с методами поиска.
Также реализованы механизмы преобразования моделей в схемы через [DataMapper](DataMapper.md) и валидации входных данных
с использованием зарегистрированных валидаторов.
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

### Функциональность 
`CrudService` расширяет `ReadService`, добавляя возможности для управления данными.
Можно создавать новые записи, обновлять существующие, а также удалять или помечать их как удалённые ([мягкое удаление](Crud.md#2-мягкое-удаление)).
Перед сохранением выполняется валидация, а итоговый объект может быть преобразован в указанную схему.

При удалении сначала проверяется наличие связанных элементов,
чтобы избежать удаления зависимых данных. 

[Внутренние методы](Crud.md#3-внутренние-методы) сохранения и удаления могут быть переопределены.

Преобразование входных данных в модель выполняется с помощью [DataMapper](DataMapper.md).

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

