import {TableFromModel} from '../../../decorators/TableFromModel';
import {UserInfoModel} from '../models/UserInfoModel';

@TableFromModel(UserInfoModel, 'test_user_info')
export class UserInfoTable implements Partial<UserInfoModel> {
}
