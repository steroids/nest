import {Column} from '@steroidsjs/typeorm';
import {IDecimalFieldOptions} from '../../../fields/DecimalField';

export default (options: IDecimalFieldOptions) => [
    Column({
        type: 'decimal',
        default: options.defaultValue,
        nullable: options.nullable,
        precision: options.precision || 10,
        scale: options.scale || 2,
    }),
];
