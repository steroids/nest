import {Column} from '@steroidsjs/typeorm';
import {IFileField} from '../../../fields/FileField';

export default (options: IFileField) => [
    Column({
        type: options.multiple ? 'simple-array' : 'integer',
        default: options.defaultValue,
        nullable: options.nullable,
    }),
];
