import {Repository} from '@steroidsjs/typeorm';
import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@steroidsjs/nest-typeorm';
import {CrudRepository} from '../../../repositories/CrudRepository';
import {UserModel} from '../models/UserModel';
import {UserTable} from '../tables/UserTable';

@Injectable()
export class UserRepository extends CrudRepository<UserModel> {
    protected modelClass = UserModel;

    constructor(
        @InjectRepository(UserTable)
        public dbRepository: Repository<UserTable>,
    ) {
        super();
    }
}
