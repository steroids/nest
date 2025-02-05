import {TypeOrmTableFromModel} from '../../../decorators/typeorm/TypeOrmTableFromModel';
import {ImageModel} from '../models/ImageModel';

@TypeOrmTableFromModel(ImageModel, 'test_image')
export class ImageTable extends ImageModel {}
