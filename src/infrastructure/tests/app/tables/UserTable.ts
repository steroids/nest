import {TypeOrmTableFromModel} from '../../../decorators/typeorm/TypeOrmTableFromModel';
import {UserModel} from '../models/UserModel';

@TypeOrmTableFromModel(UserModel, 'test_user')
export class UserTable extends UserModel {}
