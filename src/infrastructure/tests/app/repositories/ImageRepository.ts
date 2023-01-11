import {Repository} from 'typeorm-steroids';
import {Injectable} from '@nestjs/common';
import {InjectRepository} from 'nest-typeorm-steroids';
import {CrudRepository} from '../../../repositories/CrudRepository';
import {ImageModel} from '../models/ImageModel';
import {ImageTable} from '../tables/ImageTable';

@Injectable()
export class ImageRepository extends CrudRepository<ImageModel> {
    protected modelClass = ImageModel;

    constructor(
        @InjectRepository(ImageTable)
        public dbRepository: Repository<ImageTable>,
    ) {
        super();
    }
}
