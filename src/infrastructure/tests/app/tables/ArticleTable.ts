import {TypeOrmTableFromModel} from '../../../decorators/typeorm/TypeOrmTableFromModel';
import {ArticleModel} from '../models/ArticleModel';

@TypeOrmTableFromModel(ArticleModel, 'test_article')
export class ArticleTable extends ArticleModel {}
