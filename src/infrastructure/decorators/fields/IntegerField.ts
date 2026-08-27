import {applyDecorators} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {IsInt, Max, Min} from 'class-validator';
import {BaseField, IArrayFieldOptions, IBaseFieldOptions} from './BaseField';
import {Transform, transformValueOrArray} from '../Transform';
import {getArrayValidators} from './helpers/InternalFieldMetadataHelpers';

const IS_INT_DEFAULT_MESSAGE = 'Должно быть числом';
const buildMinIntDefaultMessage = (min: number) => `Должно быть не меньше ${min}`;
const buildMaxIntDefaultMessage = (max: number) => `Должно быть не больше ${max}`;

export interface IIntegerFieldOptions extends IBaseFieldOptions, IArrayFieldOptions {
    unique?: boolean,
    isIntConstraintMessage?: string,
    minIntConstraintMessage?: string,
    maxIntConstraintMessage?: string,
}

const isEmpty = value => !value && value !== 0 && value !== '0';

export function IntegerField(options: IIntegerFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'IntegerField',
            appType: 'integer',
            swaggerType: 'number',
        }),
        ...getArrayValidators(options),
        Transform(({value}) => transformValueOrArray(value, (item) => !isEmpty(item)
            ? _toInteger(item)
            : null)),
        IsInt({
            message: options.isIntConstraintMessage || IS_INT_DEFAULT_MESSAGE,
            each: options.isArray,
        }),
        typeof options.min === 'number' && Min(options.min, {
            each: options.isArray,
            message: options.minIntConstraintMessage || buildMinIntDefaultMessage(options.min),
        }),
        typeof options.max === 'number' && Max(options.max, {
            each: options.isArray,
            message: options.maxIntConstraintMessage || buildMaxIntDefaultMessage(options.max),
        }),
    ].filter(Boolean));
}
