import {TableFromModel} from '../../../decorators/TableFromModel';
import {UserModel} from '../models/UserModel';

@TableFromModel(UserModel, 'test_user')
export class UserTable extends UserModel {}
