import {Column} from '@steroidsjs/typeorm';
import {IDecimalFieldOptions} from '../../../fields/DecimalField';
import {DEFAULT_DECIMAL_SCALE} from '../../../../base/consts';

export default (options: IDecimalFieldOptions) => [
    Column({
        type: 'decimal',
        default: options.defaultValue,
        nullable: options.nullable,
        precision: options.precision || 10,
        scale: options.scale || DEFAULT_DECIMAL_SCALE,
        array: options.isArray,
    }),
];
