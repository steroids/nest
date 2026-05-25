import {ExtendField} from '../../../decorators/fields';
import {ImageModel} from '../models/ImageModel';

export class ImageSaveDto {
    @ExtendField(ImageModel)
    id?: number;

    @ExtendField(ImageModel)
    size?: string;

    @ExtendField(ImageModel)
    url?: string;

    @ExtendField(ImageModel)
    fileId?: number;
}
