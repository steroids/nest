import {Column} from 'typeorm';
import {IBaseFieldOptions} from '../../../fields/BaseField';

export default (options: IBaseFieldOptions) => [
    Column({
        type: 'varchar',
        length: 5,
        default: options.defaultValue,
        nullable: options.nullable,
    }),
];
