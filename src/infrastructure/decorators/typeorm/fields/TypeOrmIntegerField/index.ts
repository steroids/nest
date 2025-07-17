import {IAllFieldOptions} from '../../../fields';
import {Column} from '@steroidsjs/typeorm';

export default (options: IAllFieldOptions) => [
    Column({
        type: 'integer',
        default: options.defaultValue,
        unique: options.unique,
        nullable: options.nullable,
        array: options.isArray,
    }),
];
