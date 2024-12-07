import {TableFromModel} from '../../../decorators/TableFromModel';
import {ArticleModel} from '../models/ArticleModel';

@TableFromModel(ArticleModel, 'test_article')
export class ArticleTable extends ArticleModel {}
