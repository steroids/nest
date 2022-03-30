import {IntegerField, StringField} from '../../infrastructure/decorators/fields';

export interface ISearchInputDto {
    page?: number,
    pageSize?: number,
    sort?: string | string[],
}

export class SearchInputDto {

    @IntegerField({nullable: true})
    page?: number;

    @IntegerField({nullable: true})
    pageSize?: number;

    @StringField({nullable: true})
    sort?: string | string[];
}
