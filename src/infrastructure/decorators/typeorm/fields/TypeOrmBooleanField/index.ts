import {Column} from '@steroidsjs/typeorm';
import {IBaseFieldOptions} from '../../../fields/BaseField';

export default (options: IBaseFieldOptions) => [
    Column({
        type: options.dbType || 'boolean',
        default: options.defaultValue ?? false,
        nullable: options.nullable ?? false,
    }),
];
