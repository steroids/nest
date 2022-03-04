import {
    PrimaryKeyField, RelationField, RelationIdField,
    StringField
} from '../../../decorators/fields';
import {FileModel} from './FileModel';

export class ImageModel {
    @PrimaryKeyField()
    id?: number;

    @StringField()
    size?: string;

    @StringField()
    url?: string;

    @RelationIdField({
        relationName: 'file',
        nullable: true,
    })
    fileId?: number;

    @RelationField({
        type: 'ManyToOne',
        modelClass: () => FileModel,
        nullable: true,
    })
    file?: FileModel;
}
