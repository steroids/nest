import {Column} from '@steroidsjs/typeorm';
import {ICoordinateFieldOptions} from '../../../fields/CoordinateField';

export default (options: ICoordinateFieldOptions) => [
    Column({
        type: 'decimal',
        default: options.defaultValue,
        nullable: options.nullable,
        precision: options.precision || 12,
        scale: options.scale || 9,
    }),
];
