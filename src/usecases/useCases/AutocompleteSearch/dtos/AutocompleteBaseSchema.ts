import {IntegerField, RelationField, StringField} from '../../../../infrastructure/decorators/fields';

export class AutocompleteBaseItemSchema {
    @IntegerField({
        label: 'Ключ значения',
    })
    id: number

    @StringField({
        label: 'Название элемента',
    })
    label: string;
}

export class AutocompleteBaseSchema<ItemSchema = AutocompleteBaseItemSchema> {
    @RelationField({
        label: 'Результат поиска',
        type: 'ManyToMany',
        isOwningSide: true,
        relationClass: () => AutocompleteBaseItemSchema,
    })
    items: ItemSchema[];

    @RelationField({
        label: 'Выбранные значения',
        type: 'ManyToMany',
        isOwningSide: true,
        relationClass: () => AutocompleteBaseItemSchema,
    })
    selectedItems: ItemSchema[];

    @IntegerField({
        label: 'Количество найденных элементов',
    })
    total: number
}
