import {Column} from '@steroidsjs/typeorm';
import {TypeOrmUidBehaviour} from './TypeOrmUidBehaviour';
import {IBaseFieldOptions} from '../../../fields/BaseField';

export default (options: IBaseFieldOptions) => [
    Column({
        type: options.dbType || 'varchar',
        length: 36,
        default: null,
        update: false,
    }),
    TypeOrmUidBehaviour,
];
