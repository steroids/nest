import {Column} from 'typeorm';
import {IBaseFieldOptions} from '../../../fields/BaseField';

export default (options: IBaseFieldOptions) => [
    Column({
        type: 'text',
        length: options.max,
        default: options.defaultValue,
        nullable: options.nullable,
    }),
];
