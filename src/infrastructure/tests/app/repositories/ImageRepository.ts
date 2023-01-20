import {Repository} from '@steroidsjs/typeorm';
import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@steroidsjs/nest-typeorm';
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
