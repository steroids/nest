import {ExtendField, RelationField} from '../../../decorators/fields';
import {UserModel} from '../models/UserModel';
import {UserInfoSaveDto} from './UserInfoSaveDto';

export class UserSaveDto {
    @ExtendField(UserModel)
    id: number;

    @ExtendField(UserModel)
    name: string;

    @ExtendField(UserModel)
    info: UserInfoSaveDto;

    @ExtendField(UserModel)
    infoId: number;

    @ExtendField(UserModel)
    mainPhotoId: number;

    @ExtendField(UserModel)
    galleryPhotosIds: number[];
}
