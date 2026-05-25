import {Column} from '@steroidsjs/typeorm';
import {IFileField} from '../../../fields/ImageField';

export default (options: IFileField) => [
    Column({
        type: options.isArray ? 'simple-array' : 'integer',
        default: options.defaultValue,
        nullable: options.nullable,
    }),
];
