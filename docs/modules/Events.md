# События

В проектах на базе Steroids, как правило, используется стандартный пакет [@nestjs/event-emitter](https://docs.nestjs.com/techniques/events), подключаемый с учетом особенности архитектуры фреймворка.
Однако с использованием нижеописанного подхода можно использовать любое необходимое стороннее решение.

### Подключение

В проекте необходимо создать интерфейс для работы с EventEmitter-классом и токен, по которому данный сервис будет находиться в DI-контейнере:

```typescript
export interface IProjectEventEmitter {
    emit: (eventName: string | symbol, payload: {[key: string]: any}) => void,
}

export const IProjectEventEmitter = 'IProjectEventEmitter';
```

Далее необходимо в инфраструктурной части проекта определить сервис, реализующий данный интерфейс:

```typescript
import {EventEmitter2} from '@nestjs/event-emitter';
import {
    Inject,
    Injectable,
} from '@nestjs/common';
import {IProjectEventEmitter} from '../../domain/IProjectEventEmitter';

@Injectable()
export class ProjectEventEmiter implements IProjectEventEmitter {
    constructor(
        @Inject()
        private readonly eventEmitter: EventEmitter2,
    ) {}
    
    public emit(eventName: string | symbol, payload: {[key: string]: any}) {
        return this.eventEmitter.emit(eventName, payload);
    }
}
```

Подключить данный класс и необходимую ему стороннюю зависимость в нужный модуль (как правило, основной модуль приложения):

```typescript
import {Module} from '@steroidsjs/nest/infrastructure/decorators/Module';
import {EventEmitterModule} from '@nestjs/event-emitter';
import {IProjectEventEmitter} from '../domain/interfaces/IProjectEventEmitter';

@Module({
    module: () => ({
        imports: [
            EventEmitterModule.forRoot(),
        ],
        providers: [
            {
                provide: IProjectEventEmitter,
                useClass: ProjectEventEmiter,
            },
        ],
        exports: [
            IProjectEventEmitter,
        ],
    }),
})
export class SomeModule {}
```

### Генерация событий

Для генерации событий необходимо создать класс DTO, который будет содержать имя события (в качестве статического свойства) и payload самого события:

```typescript
import {IntegerField} from '@steroidsjs/nest/infrastructure/decorators/fields';

export class OrderCreatedEventDto {
    static eventName = 'Order.Created';

    @IntegerField()
    orderId: number;
}

```

После чего подключить IProjectEventEmitter в нужный сервис и вызвать метод emit:

```typescript
import {CrudService} from '@steroidsjs/nest/usecases/services/CrudService';
import {DataMapper} from '@steroidsjs/nest/usecases/helpers/DataMapper';
import {OrderModel} from '../models/OrderModel';
import {OrderSearchDto} from '../dtos/order/OrderSearchDto';
import {OrderSaveDto} from '../dtos/order/OrderSaveDto';
import {IOrderRepository} from '../interfaces/IOrderRepository';
import {IProjectEventEmitter} from '../../../base/domain/interfaces/IProjectEventEmitter';
import {ContextDto} from '../../../auth/domain/dtos/ContextDto';
import {OrderCreatedEventDto} from '../dtos/order/events/OrderCreatedEventDto';

export class OrderService extends CrudService<OrderModel, OrderSearchDto, OrderSaveDto> {
    protected modelClass = OrderModel;

    constructor(
        /** OrderRepository */
        protected readonly repository: IOrderRepository,
        protected readonly eventEmitterService: IProjectEventEmitter,
    ) {
        super();
    }

    async saveInternal(prevModel: OrderModel | null, nextModel: OrderModel, context?: ContextDto) {
        await this.repository.save(nextModel);

        if (!prevModel) {
            this.eventEmitterService.emit(
                OrderCreatedEventDto.eventName,
                DataMapper.create(OrderCreatedEventDto, {
                    orderId: nextModel.id,
                }),
            );
        }
    }
}
```

### Прослушивание событий

Для прослушивания событий необходимо создать класс Subscriber в инфраструктурной части приложения. Реализация данного класса будет зависеть от используемого решения, ниже описан пример для стандартного @nestjs/event-emitter

```typescript
import {Inject, Injectable} from '@nestjs/common';
import {OnEvent} from '@nestjs/event-emitter';
import {OrderCreatedEventDto} from '../../domain/dtos/order/events/OrderCreatedEventDto';
import {OrderService} from '../../domain/services/OrderService';

@Injectable()
export class OrderEventsSubscriber {
    constructor(
        @Inject(OrderService)
        private readonly orderService: OrderService,
    ) {}
    
    @OnEvent(OrderCreatedEventDto.eventName)
    async onCreated(payload: OrderCreatedEventDto) {
        const order = await this.orderService.findById(payload.orderId);
        
        console.log('Создан заказ: ', order);
    }
}
```

