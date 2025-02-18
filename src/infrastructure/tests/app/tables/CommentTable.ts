import {TableFromModel} from '../../../decorators/TableFromModel';
import {CommentModel} from '../models/CommentModel';

@TableFromModel(CommentModel, 'test_comment')
export class CommentTable extends CommentModel {}
