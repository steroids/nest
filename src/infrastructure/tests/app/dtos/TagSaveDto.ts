import {ExtendField} from '../../../decorators/fields';
import {TagModel} from '../models/TagModel';

export class TagSaveDto {
    @ExtendField(TagModel)
    id: number;

    @ExtendField(TagModel)
    title: string;
}
