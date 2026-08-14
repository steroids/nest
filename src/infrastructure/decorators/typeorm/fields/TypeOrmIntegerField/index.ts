import {Column} from 'typeorm';
import {IAllFieldOptions} from '../../../fields';

export default (options: IAllFieldOptions) => [
    Column({
        type: 'integer',
        default: options.defaultValue,
        unique: options.unique,
        nullable: options.nullable,
        array: options.isArray,
    }),
];
