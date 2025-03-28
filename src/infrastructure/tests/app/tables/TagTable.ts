import {TypeOrmTableFromModel} from '../../../decorators/typeorm/TypeOrmTableFromModel';
import {TagModel} from '../models/TagModel';

@TypeOrmTableFromModel(TagModel, 'test_tag')
export class TagTable extends TagModel {}
