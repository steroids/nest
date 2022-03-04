import {
    PrimaryKeyField, RelationField, RelationIdField,
    StringField
} from '../../../decorators/fields';
import {FileModel} from './FileModel';
import {UserInfoModel} from './UserInfoModel';

export class UserModel {
    @PrimaryKeyField()
    id: number;

    @StringField()
    name: string;

    @RelationIdField({
        relationName: 'info',
    })
    infoId: number;

    @RelationField({
        type: 'OneToOne',
        modelClass: () => UserInfoModel,
        isOwningSide: true,
        nullable: true,
    })
    info: UserInfoModel;

    @RelationIdField({
        relationName: 'mainPhoto',
    })
    mainPhotoId: number;

    @RelationField({
        type: 'ManyToOne',
        modelClass: () => FileModel,
        nullable: true,
    })
    mainPhoto: FileModel;

    @RelationIdField({
        relationName: 'galleryPhotos',
        isArray: true,
    })
    galleryPhotosIds: number[];

    @RelationField({
        type: 'ManyToMany',
        isOwningSide: true,
        modelClass: () => FileModel,
    })
    galleryPhotos: FileModel[];
}
