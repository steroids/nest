import {TypeOrmTableFromModel} from '../../../decorators/typeorm/TypeOrmTableFromModel';
import {UserInfoModel} from '../models/UserInfoModel';

@TypeOrmTableFromModel(UserInfoModel, 'test_user_info')
export class UserInfoTable extends UserInfoModel {}
