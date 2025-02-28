# Steroids Nest Migration Guide

## [3.0.3](../CHANGELOG.md#303-2024-02-28) (2024-02-28)

### Рефакторинг процесса сохранения модели

Методы сохранения модели в CrudService и метод saveInternal в CrudRepository теперь явно возвращают сохраненную модель, а не мутируют передаваемую в них nextModel
Если в проекте используется переопределение метода saveInternal в CrudService, необходимо обновить их следующим образом:

До
```ts
async saveInternal(prevModel: StoreModel | null, nextModel: StoreModel, context?: ContextDto) {
    await this.repository.save(nextModel);
}
```

После
```ts
async saveInternal(prevModel: StoreModel | null, nextModel: StoreModel, diffModel: StoreModel, context?: ContextDto) {
    return this.repository.save(diffModel);
}
```

Также, если в проекте используется переопределение метода saveInternal в CrudRepository, необходимо обновить их следующим образом:

До
```ts
async saveInternal(manager: ISaveManager, nextModel: TModel) {
    await manager.save(nextModel);
}
```

После
```ts
async saveInternal(manager: ISaveManager, nextModel: TModel) {
    return manager.save(nextModel);
}
```

## [3.0.0](../CHANGELOG.md#300-2024-02-18) (2024-02-18)

### diffModel в CrudService

Если в проекте используется переопределение метода saveInternal в CrudService, необходимо добавить в него аргумент diffModel
и передавать его в save метод репозитория. Пример:

До
```ts
async saveInternal(prevModel: StoreModel | null, nextModel: StoreModel, context?: ContextDto) {
    await this.repository.save(nextModel);
}
```

После
```ts
async saveInternal(prevModel: StoreModel | null, nextModel: StoreModel, diffModel: StoreModel, context?: ContextDto) {
    await this.repository.save(diffModel);
}
```

### ModuleHelper.provide

Метод ModuleHelper.provide теперь отмечен как deprecated, рекомендуется использовать стандартные инструменты NestJS для подключения
провайдеров в модуль. Пример:

До
```ts
@Module({
    module: () => ({
        providers: [
            ModuleHelper.provide(SyncMessageService, [
                ISyncMessageRepository,
            ]),
        ],
    }),
})
export class SyncModule {
}

class SyncMessageService {
    constructor(
       private readonly syncMessageRepository: ISyncMessageRepository,
    ) {}
}
```

После
```ts
@Module({
    module: () => ({
        providers: [
            SyncMessageService
        ],
    }),
})
export class SyncModule {
}

@Injectable()
class SyncMessageService {
    constructor(
        @Inject(ISyncMessageRepository)
        private readonly syncMessageRepository: ISyncMessageRepository,
    ) {}
}
```

### Типизация *Table классов

Для корректной типизации *Table классов рекомендуется заменить использование интерфейса IDeepPartial на наследование *Table
класса от класса соответствующей модели. Пример:

До
```ts
@TableFromModel(SyncMessageModel, 'sync_message')
export class SyncMessageTable implements IDeepPartial<SyncMessageModel> {}
```

После
```ts
@TableFromModel(SyncMessageModel, 'sync_message')
export class SyncMessageTable extends SyncMessageModel {}
```
