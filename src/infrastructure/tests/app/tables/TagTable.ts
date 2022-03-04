import {TableFromModel} from '../../../decorators/TableFromModel';
import {TagModel} from '../models/TagModel';

@TableFromModel(TagModel, 'test_tag')
export class TagTable implements Partial<TagModel> {
}
