import {ExtendField} from '../../../decorators/fields/ExtendField';
import {ImageModel} from '../models/ImageModel';

export class ImageSchema {
    @ExtendField(ImageModel)
    id: number;

    @ExtendField(ImageModel)
    size: string;

    @ExtendField(ImageModel)
    url: string;
}
