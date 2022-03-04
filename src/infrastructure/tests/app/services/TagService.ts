import {CrudService} from '../../../../usecases/services/CrudService';
import {SearchInputDto} from '../../../../usecases/dtos/SearchInputDto';
import {TagModel} from '../models/TagModel';
import {TagRepository} from '../repositories/TagRepository';
import {Injectable} from '@nestjs/common';

@Injectable()
export class TagService extends CrudService<TagModel, SearchInputDto, TagModel> {
    protected modelClass = TagModel;

    constructor(
        /** @see TagRepository  */
        public repository: TagRepository,
    ) {
        super();
    }

}
