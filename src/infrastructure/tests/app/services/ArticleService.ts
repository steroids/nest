import {Injectable} from '@nestjs/common';
import {CrudService} from '../../../../usecases/services/CrudService';
import {SearchInputDto} from '../../../../usecases/dtos/SearchInputDto';
import {ArticleModel} from '../models/ArticleModel';
import {ArticleRepository} from '../repositories/ArticleRepository';

@Injectable()
export class ArticleService extends CrudService<ArticleModel, SearchInputDto, ArticleModel> {
    protected modelClass = ArticleModel;

    constructor(
        /** @see ArticleRepository  */
        public repository: ArticleRepository,
    ) {
        super();
    }

}
