import {Injectable} from '@nestjs/common';
import {CrudService} from '../../../../usecases/services/CrudService';
import {SearchInputDto} from '../../../../usecases/dtos/SearchInputDto';
import {CommentModel} from '../models/CommentModel';
import {CommentRepository} from '../repositories/CommentRepository';

@Injectable()
export class CommentService extends CrudService<CommentModel, SearchInputDto, CommentModel> {
    protected modelClass = CommentModel;

    constructor(
        /** @see CommentRepository  */
        public repository: CommentRepository,
    ) {
        super();
    }

}
