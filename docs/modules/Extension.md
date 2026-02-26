# Расширение модулей

Несмотря на то, что Steroids Nest модули предоставляют богатую функциональность, которая может быть использована
"из коробки", в некоторых случаях может возникать необходимость в её расширении или переопределении. В таком случае
библиотекой предусмотрены механизмы расширения и переопределения различных компонентов модуля, таких как модели,
репозитории, сервисы и т.д.

Основной инструмент для расширения функциональности модуля - декоратор `@Module` из `@steroidsjs/nest`.
Переданные в него объект конфигурации с интерфейсом `IModule` из `@steroidsjs/nest` позволяет расширить
или переопределить различные его части. В ключе `module` лежит
конфигурация для декоратора `@Module` из `@nestjs/common`, с определенными в ней массивами `imports`, `controllers`,
`providers` и `exports`.

Рассмотрим расширение функциональности на примере модуля [@steroidsjs/nest-notifier](https://github.com/steroids/nest-notifier/blob/main/README.md).

```typescript
import {Module} from '@steroidsjs/nest/infrastructure/decorators/Module';
// Импортируем базовый конфиг
import coreModule from '@steroidsjs/nest-notifier';

@Module({
    ...coreModule,
    // При необходимости можно переопределить настройки для module функции,
    // которые будут переданы первым аргументом в функцию ниже
    config: () => ({
        ...coreModule.config(),
    }),
    // Переопределяем фукнцию module из базового конфига
    // Аргумент config будет передан из фукнции config выше
    module: (config) => {
        // Получаем настройки для NestJS модуля из библиотеки (imports, controllers, providers и exports)
        const module = coreModule.module(config);
        // Переопределяем настройки для NestJS модуля
        // Тут можно добавить кастомные провайдеры, импорты и тд
        return {
            imports: [...module.imports],
            controllers: [...module.controllers],
            providers: [...module.providers],
            exports: [...module.exports]
        };
    },
})
export class NotifierModule {}
```

## Расширение и переопределение сущностей модуля

Ниже приведены примеры расширения и переопределения различных сущностей модуля.

### Модель

```typescript
import {NotifierSendLogModel as BaseNotifierSendLogModel} from '@steroidsjs/nest-notifier/domain/models/NotifierSendLogModel';
import {StringField} from '@steroidsjs/nest/infrastructure/decorators/fields';

export class NotifierSendLogModel extends BaseNotifierSendLogModel {
    @StringField({
        label: 'Custom string field',
        nullable: true,
    })
    customStringField: string;
}
```

### ORM-сущность

```typescript
import {TypeOrmTableFromModel} from '@steroidsjs/nest/infrastructure/decorators/typeorm/TypeOrmTableFromModel';
import {NotifierSendLogModel} from '../../domain/models/NotifierSendLogModel';

@TypeOrmTableFromModel(NotifierSendLogModel, 'notifier_send_log')
export class NotifierSendLogTable extends NotifierSendLogModel {}
```

### Репозиторий

```typescript
import {NotifierSendLogRepository as BaseNotifierSendLogRepository} from '@steroidsjs/nest-notifier/infrastructure/repositories/NotifierSendLogRepository';
import {InjectRepository} from '@steroidsjs/nest-typeorm';
import {Repository} from '@steroidsjs/typeorm';
import {Injectable} from '@nestjs/common';
import {NotifierSendLogTable} from '../tables/NotifierSendLogTable';
import {NotifierSendLogModel} from '../../domain/models/NotifierSendLogModel';

@Injectable()
export class NotifierSendLogRepository extends BaseNotifierSendLogRepository {
    constructor(
        @InjectRepository(NotifierSendLogTable)
        readonly dbRepository: Repository<NotifierSendLogTable>,
    ) {
        super(dbRepository);
    }

    protected modelClass = NotifierSendLogModel;
}
```

### Интерфейс репозитория при расширении модели

```typescript
import {ICrudRepository} from '@steroidsjs/nest/usecases/interfaces/ICrudRepository';
import {INotifierSendLogRepository as BaseINotifierSendLogRepository} from '@steroidsjs/nest-notifier/domain/interfaces/INotifierSendLogRepository';
import {NotifierSendLogModel} from '../models/NotifierSendLogModel';

export const INotifierSendLogRepository = BaseINotifierSendLogRepository;

export type INotifierSendLogRepository = ICrudRepository<NotifierSendLogModel>;
```

### CRUD-сервис

```typescript
import {NotifierSendLogService as BaseNotifierSendLogService} from '@steroidsjs/nest-notifier/domain/services/NotifierSendLogService';
import {INotifierSendLogRepository} from '../interfaces/INotifierSendLogRepository';
import {Inject, Injectable} from '@nestjs/common';
import {NotifierSendLogModel} from '../models/NotifierSendLogModel';

@Injectable()
export class NotifierSendLogService extends BaseNotifierSendLogService {
    constructor(
        @Inject(INotifierSendLogRepository)
        readonly repository: INotifierSendLogRepository,
    ) {
        super(repository);
    }

    protected modelClass = NotifierSendLogModel;
}
```

### Сервис

```typescript
import {NotifierSendLogService as BaseNotifierSendLogService} from '@steroidsjs/nest-notifier/domain/services/NotifierSendLogService';
import {NotifierSendLogModel} from '@steroidsjs/nest-notifier/domain/models/NotifierSendLogModel';
import {INotifierSendLogRepository} from '@steroidsjs/nest-notifier/domain/interfaces/INotifierSendLogRepository';
import {Inject, Injectable} from '@nestjs/common';
import {ContextDto} from '../../../auth/domain/dtos/ContextDto';

@Injectable()
export class NotifierSendLogService extends BaseNotifierSendLogService {
    constructor(
        @Inject(INotifierSendLogRepository)
        readonly repository: INotifierSendLogRepository,
    ) {
        super(repository);
    }

    // Переопределение метода
    findById(id: number | string, context?: ContextDto | null): Promise<NotifierSendLogModel> {
        return super.findById(id, context);
    }

    // Новый метод
    doSomething() {
        console.log('something');
    }
}
```

## Подключение переопределённых сущностей

```typescript
import {join} from 'path';
import {Module} from '@steroidsjs/nest/infrastructure/decorators/Module';
import coreModule from '@steroidsjs/nest-notifier';
import {ModuleHelper} from '@steroidsjs/nest/infrastructure/helpers/ModuleHelper';
import {INotifierModuleConfig} from '@steroidsjs/nest-notifier/infrastructure/config';
import {NotifierSendLogService as BaseNotifierSendLogService} from '@steroidsjs/nest-notifier/domain/services/NotifierSendLogService';
import {INotifierSendLogRepository} from '../domain/interfaces/INotifierSendLogRepository';
import {NotifierSendLogRepository} from './repositories/NotifierSendLogRepository';
import {NotifierSendLogService} from '../domain/services/NotifierSendLogService';

@Module({
    ...coreModule,
    tables: [
        ...coreModule.tables,
        ...ModuleHelper.importDir(join(__dirname, '/tables')),
    ],
    module: (config: INotifierModuleConfig) => {
        const module = coreModule.module(config);
        return {
            ...module,
            providers: [
                ...module.providers,
                {
                    provide: INotifierSendLogRepository,
                    useClass: NotifierSendLogRepository,
                },
                {
                    provide: BaseNotifierSendLogService,
                    useClass: NotifierSendLogService,
                },
            ],
        };
    },
})
export class NotifierModule {}
```
