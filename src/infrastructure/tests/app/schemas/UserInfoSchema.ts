import {ExtendField} from '../../../decorators/fields/ExtendField';
import {UserInfoModel} from '../models/UserInfoModel';
import {FileSchema} from './FileSchema';

export class UserInfoSchema {
    @ExtendField(UserInfoModel)
    id: number;

    @ExtendField(UserInfoModel)
    passport: string;

    @ExtendField(UserInfoModel, {
        relationClass: () => FileSchema,
    })
    passportScan: FileSchema;
}
