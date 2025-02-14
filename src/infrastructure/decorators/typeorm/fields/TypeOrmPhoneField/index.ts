import {Column} from '@steroidsjs/typeorm';
import {IPhoneFieldOptions} from '../../../fields/PhoneField';

export default (options: IPhoneFieldOptions) => [
    Column({
        type: 'varchar',
        length: options.max || 16,
        default: options.defaultValue,
        unique: options.unique,
        nullable: options.nullable,
    }),
];
