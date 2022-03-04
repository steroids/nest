import {CrudService} from '../../../../usecases/services/CrudService';
import {SearchInputDto} from '../../../../usecases/dtos/SearchInputDto';
import {UserModel} from '../models/UserModel';
import {UserRepository} from '../repositories/UserRepository';
import {Injectable} from '@nestjs/common';

@Injectable()
export class UserService extends CrudService<UserModel, SearchInputDto, UserModel> {
    protected modelClass = UserModel;

    constructor(
        /** @see UserRepository  */
        public repository: UserRepository,
    ) {
        super();
    }

}
