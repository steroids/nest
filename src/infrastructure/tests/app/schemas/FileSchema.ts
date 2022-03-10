import {ExtendField} from '../../../decorators/fields/ExtendField';
import {FileModel} from '../models/FileModel';

export class FileSchema {
    @ExtendField(FileModel)
    id: number;

    @ExtendField(FileModel)
    name: string;
}
