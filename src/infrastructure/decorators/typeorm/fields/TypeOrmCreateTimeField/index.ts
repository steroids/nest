import {Column} from '@steroidsjs/typeorm';
import {TypeOrmCreateTimeBehaviour} from './TypeOrmCreateTimeBehaviour';
import {ICreateTimeFieldOptions} from '../../../fields/CreateTimeField';

export default (options: ICreateTimeFieldOptions) => [
    Column({
        type: 'timestamp',
        precision: options.precision || 0,
        default: options.defaultValue,
        nullable: options.nullable ?? false,
    }),
    TypeOrmCreateTimeBehaviour,
];
