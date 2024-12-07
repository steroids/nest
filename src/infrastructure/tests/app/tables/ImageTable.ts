import {TableFromModel} from '../../../decorators/TableFromModel';
import {ImageModel} from '../models/ImageModel';

@TableFromModel(ImageModel, 'test_image')
export class ImageTable extends ImageModel {}
