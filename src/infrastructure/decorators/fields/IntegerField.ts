import {applyDecorators} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {IsInt, Max, Min, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform} from '../Transform';

export const IS_INT_DEFAULT_MESSAGE = 'Должно быть числом';
export const buildMinIntDefaultMessage = (min: number) => `Должно быть не меньше ${min}`;
export const buildMaxIntDefaultMessage = (max: number) => `Должно быть не больше ${max}`;

export interface IIntegerFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
    isIntConstraintMessage?: string,
    minIntConstraintMessage?: string,
    maxIntConstraintMessage?: string,
}

const isEmpty = value => !value && value !== 0 && value !== '0';
const isArrayEmpty = value => !value || (Array.isArray(value) && value?.length === 0);

export function IntegerField(options: IIntegerFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'IntegerField',
            appType: 'integer',
            jsType: 'number',
        }),
        options.nullable && ValidateIf((object, value) => options.isArray ? !isArrayEmpty(value) : !isEmpty(value)),
        Transform(({value}) => {
            if (Array.isArray(value)) {
                return value.map(valueItem => !isEmpty(valueItem) ? _toInteger(valueItem) : null);
            }
            return !isEmpty(value) ? _toInteger(value) : null;
        }),
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
