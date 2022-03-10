import {ExtendField} from '../../../decorators/fields/ExtendField';
import {UserModel} from '../models/UserModel';
import {UserInfoSchema} from './UserInfoSchema';
import {FileSchema} from './FileSchema';

export class UserSchema {
    @ExtendField(UserModel)
    id: number;

    @ExtendField(UserModel)
    name: string;

    @ExtendField(UserModel, {
        relationClass: () => UserInfoSchema,
    })
    info: UserInfoSchema;

    @ExtendField(UserModel, {
        relationClass: () => FileSchema,
    })
    mainPhoto: FileSchema;
}
