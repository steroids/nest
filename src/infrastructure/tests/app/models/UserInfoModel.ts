import {
    PrimaryKeyField, RelationField, RelationIdField,
    StringField
} from '../../../decorators/fields';
import {UserModel} from './UserModel';
import {FileModel} from './FileModel';

export class UserInfoModel {
    @PrimaryKeyField()
    id: number;

    @StringField()
    passport: string;

    @RelationIdField({
        relationName: 'passportScan',
    })
    passportScanId: number;

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => FileModel,
        nullable: true,
    })
    passportScan: FileModel;

    @RelationIdField({
        relationName: 'user',
    })
    userId: number;

    @RelationField({
        type: 'OneToOne',
        relationClass: () => UserModel,
        isOwningSide: false,
        nullable: true,
    })
    user: UserModel;
}
