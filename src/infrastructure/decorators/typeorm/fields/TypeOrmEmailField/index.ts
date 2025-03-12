import {Column} from '@steroidsjs/typeorm';
import {IEmailFieldOptions} from '../../../fields/EmailField';

export default (options: IEmailFieldOptions) => [
    Column({
        type: 'varchar',
        default: options.defaultValue,
        unique: options.unique,
        nullable: options.nullable,
    }),
];
