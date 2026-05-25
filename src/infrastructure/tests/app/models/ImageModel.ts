import {
    PrimaryKeyField, RelationField, RelationIdField,
    StringField,
} from '../../../decorators/fields';
import {FileModel} from './FileModel';

export class ImageModel {
    @PrimaryKeyField()
    id?: number;

    @StringField()
    size?: string;

    @StringField()
    url?: string;

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => FileModel,
        nullable: true,
    })
    file?: FileModel;

    @RelationIdField({
        relationName: 'file',
        nullable: true,
    })
    fileId?: number;
}
