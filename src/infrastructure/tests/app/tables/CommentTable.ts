import {TypeOrmTableFromModel} from '../../../decorators/typeorm/TypeOrmTableFromModel';
import {CommentModel} from '../models/CommentModel';

@TypeOrmTableFromModel(CommentModel, 'test_comment')
export class CommentTable extends CommentModel {}
