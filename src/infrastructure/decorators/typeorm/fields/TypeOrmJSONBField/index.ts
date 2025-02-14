import {Column} from '@steroidsjs/typeorm';
import {IJSONBFieldOptions} from '../../../fields/JSONBField';

export default (options: IJSONBFieldOptions) => [
    Column({
        type: 'jsonb',
        length: options.max,
        default: options.defaultValue,
        nullable: options.nullable,
        array: options.isArray,
    }),
];
