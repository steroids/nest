import {Repository} from 'typeorm';
import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {CrudRepository} from '../../../repositories/CrudRepository';
import {FileModel} from '../models/FileModel';
import {FileTable} from '../tables/FileTable';

@Injectable()
export class FileRepository extends CrudRepository<FileModel> {
    protected modelClass = FileModel;

    constructor(
        @InjectRepository(FileTable)
        public dbRepository: Repository<FileTable>,
    ) {
        super();
    }
}
