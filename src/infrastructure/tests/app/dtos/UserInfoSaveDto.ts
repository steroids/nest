import {ExtendField} from '../../../decorators/fields';
import {UserInfoModel} from '../models/UserInfoModel';

export class UserInfoSaveDto {
    @ExtendField(UserInfoModel)
    id: number;

    @ExtendField(UserInfoModel)
    passport: string;

    @ExtendField(UserInfoModel)
    passportScanId: number;

    @ExtendField(UserInfoModel)
    userId: number;
}
