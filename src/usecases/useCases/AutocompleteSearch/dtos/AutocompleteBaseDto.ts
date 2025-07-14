import {SearchInputDto} from '../../../dtos/SearchInputDto';
import {IntegerField} from '../../../../infrastructure/decorators/fields';

export class AutocompleteBaseDto extends SearchInputDto {
    @IntegerField({
        label: 'ID выбранных значений. Возвращаются в поле selectedItems',
        nullable: true,
        isArray: true,
    })
    withIds?: number[];
}
