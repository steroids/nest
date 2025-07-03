import {SearchInputDto} from '../../../dtos/SearchInputDto';
import {IntegerField, StringField} from '../../../../infrastructure/decorators/fields';

export class AutocompleteBaseDto extends SearchInputDto {
    @StringField({
        label: 'Поисковый запрос',
        nullable: true,
    })
    query?: string;

    @IntegerField({
        label: 'ID выбранных значений. Возвращаются в поле selectedItems',
        nullable: true,
        isArray: true,
    })
    withIds?: number[];
}
