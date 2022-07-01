import {applyDecorators} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {Column} from 'typeorm';
import {IsInt, Max, Min, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform} from '../Transform';

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
        Column({
            type: 'integer',
            default: options.defaultValue,
            unique: options.unique,
            nullable: options.nullable,
        }),
        options.nullable && ValidateIf((object, value) => options.isArray ? !isArrayEmpty(value) : !isEmpty(value)),
        Transform(({value}) => {
            if (Array.isArray(value)) {
                return value.map(valueItem => !isEmpty(valueItem) ? _toInteger(valueItem) : null);
            }
            return !isEmpty(value) ? _toInteger(value) : null;
        }),
        IsInt({
            message: options.isIntConstraintMessage || 'Должно быть числом',
            each: options.isArray,
        }),
        typeof options.min === 'number' && Min(options.min, {
            each: options.isArray,
            message: `Должно быть не меньше ${options.min}` || options.minIntConstraintMessage,
        }),
        typeof options.max === 'number' && Max(options.max, {
            each: options.isArray,
            message: `Должно быть не больше ${options.max}` || options.maxIntConstraintMessage,
        }),
    ].filter(Boolean));
}
