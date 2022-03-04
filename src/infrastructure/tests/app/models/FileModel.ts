import {
    PrimaryKeyField, RelationField, StringField,
} from '../../../decorators/fields';
import {ImageModel} from './ImageModel';

export class FileModel {
    @PrimaryKeyField()
    id?: number;

    @StringField()
    name?: string;

    @RelationField({
        type: 'OneToMany',
        modelClass: () => ImageModel,
    })
    images?: ImageModel[];
}
