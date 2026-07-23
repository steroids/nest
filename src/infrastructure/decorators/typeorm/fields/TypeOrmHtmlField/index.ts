import {Column} from 'typeorm';
import {IBaseFieldOptions} from '../../../fields/BaseField';

export default (options: IBaseFieldOptions) => [
    Column({
        type: 'text',
        default: options.defaultValue,
        nullable: options.nullable,
    }),
];
