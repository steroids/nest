import {Column} from '@steroidsjs/typeorm';
import {IDateFieldOptions} from '../../../fields/DateField';

export default (options: IDateFieldOptions) => [
    Column({
        type: 'date',
        default: options.defaultValue,
        nullable: options.nullable,
    }),
];
