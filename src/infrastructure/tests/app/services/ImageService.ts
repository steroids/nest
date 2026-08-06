import {Injectable} from '@nestjs/common';
import {CrudService} from '../../../../usecases/services/CrudService';
import {SearchInputDto} from '../../../../usecases/dtos/SearchInputDto';
import {ImageModel} from '../models/ImageModel';
import {ImageRepository} from '../repositories/ImageRepository';

@Injectable()
export class ImageService extends CrudService<ImageModel, SearchInputDto, ImageModel> {
    protected modelClass = ImageModel;

    constructor(
        /** @see ImageRepository  */
        public repository: ImageRepository,
    ) {
        super();
    }

}
