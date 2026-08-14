import {Column} from 'typeorm';
import {IStringFieldOptions} from '../../../fields/StringField';

export default (options: IStringFieldOptions) => [
    Column({
        type: 'varchar',
        length: options.max,
        default: options.defaultValue,
        unique: options.unique,
        nullable: options.nullable,
        array: options.isArray,
    }),
];
