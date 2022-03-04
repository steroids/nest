import {
    PrimaryKeyField,
    StringField} from '../../../decorators/fields';

export class TagModel {
    @PrimaryKeyField()
    id: number;

    @StringField()
    title: string;
}
