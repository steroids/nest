import {Repository} from 'typeorm-steroids';
import {Injectable} from '@nestjs/common';
import {InjectRepository} from 'nest-typeorm-steroids';
import {CrudRepository} from '../../../repositories/CrudRepository';
import {ArticleModel} from '../models/ArticleModel';
import {ArticleTable} from '../tables/ArticleTable';

@Injectable()
export class ArticleRepository extends CrudRepository<ArticleModel> {
    protected modelClass = ArticleModel;

    constructor(
        @InjectRepository(ArticleTable)
        public dbRepository: Repository<ArticleTable>,
    ) {
        super();
    }
}
