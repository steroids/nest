import {
    PrimaryKeyField, RelationField, RelationIdField, StringField,
} from '../../../decorators/fields';
import {ImageModel} from './ImageModel';

export class FileModel {
    @PrimaryKeyField()
    id?: number;

    @StringField()
    name?: string;

    @RelationField({
        type: 'OneToMany',
        inverseSide: image => image.file,
        relationClass: () => ImageModel,
    })
    images?: ImageModel[];

    @RelationIdField({
        relationName: 'images',
        isArray: true,
    })
    imagesIds: number[];
}
