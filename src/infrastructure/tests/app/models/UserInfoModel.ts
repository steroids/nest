import {
    PrimaryKeyField, RelationField, RelationIdField,
    StringField
} from '../../../decorators/fields';
import {UserModel} from './UserModel';

export class UserInfoModel {
    @PrimaryKeyField()
    id: number;

    @StringField()
    passport: string;

    @RelationIdField({
        relationName: 'user',
    })
    userId: number;

    @RelationField({
        type: 'OneToOne',
        modelClass: () => UserModel,
        nullable: true,
    })
    user: UserModel;
}
