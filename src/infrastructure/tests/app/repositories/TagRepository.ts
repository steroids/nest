import {Repository} from 'typeorm-steroids';
import {Injectable} from '@nestjs/common';
import {InjectRepository} from 'nest-typeorm-steroids';
import {CrudRepository} from '../../../repositories/CrudRepository';
import {TagModel} from '../models/TagModel';
import {TagTable} from '../tables/TagTable';

@Injectable()
export class TagRepository extends CrudRepository<TagModel> {
    protected modelClass = TagModel;

    constructor(
        @InjectRepository(TagTable)
        public dbRepository: Repository<TagTable>,
    ) {
        super();
    }
}
