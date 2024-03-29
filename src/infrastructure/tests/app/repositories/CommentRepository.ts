import {Repository} from '@steroidsjs/typeorm';
import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@steroidsjs/nest-typeorm';
import {CrudRepository} from '../../../repositories/CrudRepository';
import {CommentModel} from '../models/CommentModel';
import {CommentTable} from '../tables/CommentTable';

@Injectable()
export class CommentRepository extends CrudRepository<CommentModel> {
    protected modelClass = CommentModel;

    constructor(
        @InjectRepository(CommentTable)
        public dbRepository: Repository<CommentTable>,
    ) {
        super();
    }
}
