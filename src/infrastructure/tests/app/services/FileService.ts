import {CrudService} from '../../../../usecases/services/CrudService';
import {SearchInputDto} from '../../../../usecases/dtos/SearchInputDto';
import {FileModel} from '../models/FileModel';
import {FileRepository} from '../repositories/FileRepository';
import {Injectable} from '@nestjs/common';

@Injectable()
export class FileService extends CrudService<FileModel, SearchInputDto, FileModel> {
    protected modelClass = FileModel;

    constructor(
        /** @see FileRepository  */
        public repository: FileRepository,
    ) {
        super();
    }

}
