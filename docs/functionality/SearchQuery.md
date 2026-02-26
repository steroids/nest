# SearchQuery

Этот класс используется для создания простых запросов в доменной области проекта. На основе его экземпляра, с помощью адаптера, генерируются запросы для различных ORM. В настоящее время доступен адаптер для TypeORM.

Экземпляр SearchQuery можно создать самому и передать в методы findOne/findMany из репозитория:

```ts
public async findLastDeliveredOrder() {
	const searchQuery = new SearchQuery<OrderModel>();
	searchQuery.with([
		'picker',
		'positions',
	]);
	searchQuery.where(['=', 'status', OrderStatusEnum.DELIVERED]);
	searchQuery.orderBy('id', 'desc');   
	const order = await this.findOne(searchQuery);
}
```

Либо воспользоваться функцией createQuery, реализованной в CrudService:

```ts
public async findLastDeliveredOrder() {
	  const order = await this.createQuery()
      .with([
          'picker',
          'positions',
      ])
      .where(['=', 'status', OrderStatusEnum.DELIVERED])
      .orderBy('id', 'desc')
      .one();
}
```

### Операторы

SearchQuery поддерживает следующий набор операторов:

- `with` - позволяет подгрузить в ходе запроса нужные зависимости (join). Необходимо передавать названия соответствующих полей в модели. Вложенные зависимости разделяются точкой. Пример:
    
    ```ts
    const order = await this.createQuery()
          .with([
              'picker',
              'positions.product',
          ])
          .one(); 
    ```
    
- `where` - позволяет задать необходимые условия. Список поддерживаемых операторов представлен ниже. Пример:
    
    ```ts
    const order = await this.createQuery()
          .where(['=', 'id', 1])
          .one();       
    ```
    
- `select` - позволяет ограничить набор возвращаемых полей. Пример:
    
    ```ts
    const order = await this.createQuery()
          .select(['id'])
          .one(); 
    ```
    
- `alias` - позволяет задать alias для основной таблицы, который будет использован в запросе. Пример:
    
    ```ts
    const order = await this.createQuery()
    			.alias('order')
          .orderBy('order.id', 'desc')
          .one(); 
    ```
    
- `limit` - позволяет ограничить количество возвращаемых записей. Пример:
    
    ```ts
    const order = await this.createQuery()
    			.limit(5)
    			.many(); 
    ```
    
- `offset` - позволяет задать отступ для возвращаемых записей. Пример:
    
    ```ts
    const order = await this.createQuery()
    			.offset(100)
    			.one(); 
    ```
    

### Условия

Функции where SearchQuery из поддерживает следующие операторы:

- `=, not =`  - сравнение значений.  Пример:
`searchQuery.where(['=', 'name', 'Вася'])`
- `>, >=, <, <=`  - сравнение чисел (поддерживается также вариации с префиксом not). Пример:
`searchQuery.where(['>', 'id', 10])`
- `like, not like`  - поиск подстроки с учетом регистра. Пример:
    
    `searchQuery.where(['like', 'name', 'ася'])` 
    
- `ilike, not ilike`  - поиск подстроки без учета регистра. Пример:
    
    `searchQuery.where(['ilike', 'name', 'АСЯ'])` 
    
- `between, not between`  - поиск числа в нужном интервале. Пример:
    
    `searchQuery.where(['between', 'size', 5, 10])` 
    
- `in, not in`  -  Поиск значения, входящего в массив значений. Пример:
    
    `searchQuery.where(['in', 'name', ['Вася', 'Коля', 'Вова']])` 
    
- `and, &&, not and, not &&`  -  Логическое “И”. Пример:
    
    ```ts
    searchQuery.where([
    	'and',
    	['=', 'isActive', true],
    	['ilike', 'name', 'ван'],
    ]);
    ```
    
- `or, ||, not or, not ||`  -  Логическое “ИЛИ”. Пример:
    
    ```ts
    searchQuery.where([
    	'or',
    	['=', 'isActive', true],
    	['ilike', 'name', 'ван'],
    ]);
    ```
    
- `@>, not @>`  -  Содержит ли первый массив второй (это значит, что каждый элемент второго массив равен какому-либо элементу первого массива). Аргументы могут быть как массивом, так и единичным значением. Данный оператор работает с полями-массивами. Пример:
    
    `searchQuery.where(['@>', 'barcodes', '4600605032343'])`
    
- `<@, not <@`  -  Содержит ли второй массив первый (это значит, что каждый элемент первого массива равен какому-либо элементу второго массива). Аргументы могут быть как массивом, так и единичным значением. Данный оператор работает с полями-массивами. Пример:
    
    `searchQuery.where(['<@', 'barcodes', ['4600605032343', '4600605032342']])` 
    
- `overlap, not overlap`  -  Есть ли у массивов пересечение (это значит, что у массивов есть хотя бы 1 общий элемент). Данный оператор работает с полями-массивами. Пример:
    
    `searchQuery.where(['overlap', 'barcodes', ['4600605032343']])` 
    
- `some`  -  Оператор, позволяющий описать подзапрос для связанных таблиц и выбрать только записи, где **хотя бы одна связанная запись удовлетворяет нужному условию**. Второй аргумент представляет из себя набор необходимых для подзапроса джойнов (оператор with из базового searchQuery). Третий аргумент представляет собо необходимое условие. Пример:
    
    ```ts
    searchQuery.where([
        'some',
        ['authRoles'],
        ['=', 'authRoles.name', dto.authRoleName],
    ]);
    ```
    
- `none`  -  Оператор, позволяющий описать подзапрос для связанных таблиц и выбрать только записи, где **ни одна связанная запись не удовлетворяет нужному условию**. Второй аргумент представляет из себя набор необходимых для подзапроса джойнов (оператор with из базового searchQuery). Третий аргумент представляет собо необходимое условие. Пример:
    
    ```ts
    searchQuery.where([
        'none',
        ['authRoles'],
        ['=', 'authRoles.name', dto.authRoleName],
    ]);
    ```
    
- `every`  -  Оператор, позволяющий описать подзапрос для связанных таблиц и выбрать только записи, где **все связанные записи удовлетворяют нужному условию**. Второй аргумент представляет из себя набор необходимых для подзапроса джойнов (оператор with из базового searchQuery). Третий аргумент представляет собо необходимое условие. Пример:
    
    ```ts
    searchQuery.where([
        'every',
        ['authRoles'],
        ['>', 'authRoles.id', 1],
    ]);
    ```
    

### Создание на основе класса

Экземпляр SearchQuery может быть создан на основе класса, имеющего Field декораторы. В таком случае автоматически заполнится набор релейшенов модели, которые нужно загрузить вместе с основной моделью для создания экземпляра этого класса:

```ts
class Model2 {
    @StringField()
    name: string;
}

class Model1 {
    @IntegerField()
    id: number;

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => Model2,
    })
    model2: Model2;
}

const searchQuery = SearchQuery.createFromSchema(Model1);
console.log(searchQuery.getWith()); // [ 'model2' ]
```

Данное поведение реализуются методы поиска из CrudService, которые последним аргументом принимают класс schemaClass.
