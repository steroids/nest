import {Column} from 'typeorm';
import {IEnumFieldOptions} from '../../../fields/EnumField';

export default (options: IEnumFieldOptions) => [
    Column({
        type: 'varchar',
        default: options.defaultValue,
        nullable: options.nullable,
        array: options.isArray,
    }),
];
