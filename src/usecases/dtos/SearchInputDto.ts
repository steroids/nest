import {IntegerField, StringField} from '../../infrastructure/decorators/fields';

export interface ISearchInputDto {
    page?: number,
    pageSize?: number,
    sort?: string | string[],
    query?: string,
}

export class SearchInputDto {
    @IntegerField({
        label: 'Номер страницы',
        nullable: true,
    })
    page?: number;

    @IntegerField({
        label: 'Размер страницы',
        nullable: true,
    })
    pageSize?: number;

    @StringField({
        label: 'Поисковый запрос',
        nullable: true,
    })
    query?: string;

    @StringField({
        label: 'Поле или массив полей, по которым будет выполнена сортировка',
        nullable: true,
    })
    sort?: string | string[];
}
