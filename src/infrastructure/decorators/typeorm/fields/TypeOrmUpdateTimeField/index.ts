import {IAllFieldOptions} from '../../../fields';
import {Column} from '@steroidsjs/typeorm';
import {TypeOrmUpdateTimeBehaviour} from './TypeOrmUpdateTimeBehaviour';

export default (options: IAllFieldOptions) => [
    Column({
        type: 'timestamp',
        precision: options.precision || 0,
        default: options.defaultValue,
        nullable: options.nullable ?? false,
    }),
    TypeOrmUpdateTimeBehaviour,
];
