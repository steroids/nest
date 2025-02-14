import {Column} from '@steroidsjs/typeorm';
import {IBaseFieldOptions} from '../../../fields/BaseField';

export default (options: IBaseFieldOptions) => [
    Column({
        type: 'varchar',
        length: 5,
        default: options.defaultValue,
        nullable: options.nullable,
    }),
];
