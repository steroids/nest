import {Column} from 'typeorm';
import {IBaseFieldOptions} from '../../../fields/BaseField';

export default (options: IBaseFieldOptions) => [
    Column({
        type: 'boolean',
        default: options.defaultValue ?? false,
        nullable: options.nullable ?? false,
    }),
];
