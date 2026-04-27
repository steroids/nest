import {ExtendField} from '../../../decorators/fields';
import {FileModel} from '../models/FileModel';
import {ImageSaveDto} from './ImageSaveDto';

export class FileSaveDto {
    @ExtendField(FileModel)
    id?: number;

    @ExtendField(FileModel)
    name?: string;

    @ExtendField(FileModel)
    images?: ImageSaveDto[];

    @ExtendField(FileModel)
    imagesIds?: number[];
}
