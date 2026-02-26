# Работа с миграциями

Работа с миграциями в Steroids представлена консольными командами, которые запускают
отдельное приложение, определенное в том же контексте, что и основное.
Файлы миграций создаются в директории `infrastructure/migrations` каждого модуля,
где имеются классы ORM-сущностей, соответствующие доменным моделям.
Также есть команды, которые упрощают создание классов моделей и связанных с ними ORM-сущностей.

## Начало работы

Сначала создать модуль консольного приложения,
а затем написать запуск приложения в консольном варианте.
Настройки подключения к базе данных должны быть такими же, как в основном приложении.

```typescript
import {ConsoleApplication} from '@steroidsjs/nest/infrastructure/applications/console/ConsoleApplication';
import {Module} from '@steroidsjs/nest/infrastructure/decorators/Module';
import baseConfig from '@steroidsjs/nest/infrastructure/applications/console/config';

@Module({
    ...baseConfig,
})
export class AppModule {}

new ConsoleApplication().start();
```

Далее нужно определить нужную доменную модель в директории `domain/models` какого-нибудь модуля.

```typescript
import {
    PrimaryKeyField,
    StringField,
    PasswordField,
} from '@steroidsjs/nest/infrastructure/decorators/fields';

export class UserModel {
    @PrimaryKeyField()
    id: number;

    @StringField({
        nullable: true,
    })
    login: string;

    @PasswordField({
        label: 'Хеш пароля',
        nullable: true,
    })
    passwordHash: string;
}
```

И в директории `infrastructure/tables` определить класс
ORM-сущности, соответствующей конкретной доменной модели.
Также в этом классе можно определить, например, индексы, ограничения
для этой ORM-сущности в виде декораторов `@Index`, `@Check`.

```typescript
import {TableFromModel} from '@steroidsjs/nest/infrastructure/decorators/TableFromModel';
import {IDeepPartial} from '@steroidsjs/nest/usecases/interfaces/IDeepPartial';
import {Index} from '@steroidsjs/typeorm';
import {UserModel} from '../../domain/models/UserModel';

@TableFromModel(UserModel, 'user')
@Index(['login'], {unique: true})
export class UserTable implements IDeepPartial<UserModel> {}
```

Затем при использовании команды `yarn cli migrate:generate` 
создастся класс миграции с уникальным названием
в директории `infrastructure/migrations` модуля, в котором находятся
классы ORM-сущности и модели, описанных ранее. После этого можно применить команду
`yarn cli migrate` для выполнения миграции и создания таблицы в базе данных.

Название класса миграции содержит название класса ORM-сущности и временную метку в миллисекундах.
Миграции будут выполняться в порядке от самой ранней временной метки в названии к самой поздней.

```typescript
import {MigrationInterface, QueryRunner} from '@steroidsjs/typeorm';

export class UserTable1695645734527 implements MigrationInterface {
    name = 'UserTable1695645734527';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" SERIAL NOT NULL,
                "login" character varying,
                "passwordHash" text
            )
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_a62473490b3e4578fd683235c5" ON "user" ("login")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a62473490b3e4578fd683235c5"
        `);
        
        await queryRunner.query(`
            DROP TABLE "user"
        `);
    }
}
```

Файлы миграций будут создаваться и для последующих изменений в модели.

Также классы миграций можно создавать вручную, например, для заполнения таблиц данными по умолчанию. 
Но в таком случае нужно учитывать временные метки в названиях миграций для корректного порядка их выполнения.

## Команды

Для сокращения записи `npx nestjs-command` заменено на `cli`, что можно
настроить в файле `package.json` в объекте `scripts`.
Был использован пакетный менеджер `yarn`.

```shell
yarn cli migrate:generate
```

Создание миграций, если модели не соответствуют
пропорциональным им ORM-сущностям в базе данных.

```shell
yarn cli migrate
```

Выполнение существующих миграций.

```shell
yarn cli migrate:revert
```

Отмена последней применённой миграции.

```shell
yarn cli migrate:show
```

Перечисление всех миграций со статусами их выполнения.

```shell
yarn cli migrate:dbml2code <path>
```

Генерация моделей и ORM-сущностей из файла расширения `dbml`, где `<path>` - путь до этого файла.

```shell
yarn cli entity:generate <entityName> <moduleName>
```

Генерация модели, репозитория,
интерфейса репозитория, сервиса, ORM-сущности,
dto для поиска и сохранения по названию модели (`<entityName>`)
и названию модуля (`<moduleName>`).

