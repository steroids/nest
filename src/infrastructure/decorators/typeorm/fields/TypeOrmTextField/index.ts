import {Column} from 'typeorm';
import {ITextFieldOptions} from '../../../fields/TextField';

export default (options: ITextFieldOptions) => [
    Column({
        type: 'text',
        length: options.max,
        default: options.defaultValue,
        nullable: options.nullable,
    }),
];
