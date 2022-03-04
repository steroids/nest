import {TableFromModel} from '../../../decorators/TableFromModel';
import {FileModel} from '../models/FileModel';

@TableFromModel(FileModel, 'test_file')
export class FileTable implements Partial<FileModel> {
}
