import {TypeOrmTableFromModel} from '../../../decorators/typeorm/TypeOrmTableFromModel';
import {FileModel} from '../models/FileModel';

@TypeOrmTableFromModel(FileModel, 'test_file')
export class FileTable extends FileModel {}
