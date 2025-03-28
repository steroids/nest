import {Column} from '@steroidsjs/typeorm';
import {IDateTimeFieldColumnOptions} from '../../../fields/DateTimeField';

export default (options: IDateTimeFieldColumnOptions) => [
    Column({
        type: 'timestamp',
        precision: options.precision || 0,
        default: options.defaultValue,
        nullable: options.nullable,
    }),
];
