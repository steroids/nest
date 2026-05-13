import {applyDecorators} from '@nestjs/common';
import {Max, Min, ValidateIf, ValidateBy, ValidationOptions, buildMessage, isDecimal} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {TRANSFORM_TYPE_FROM_DB, Transform} from '../Transform';
import {DEFAULT_DECIMAL_SCALE} from '../../base/consts';

export interface IDecimalNumberFieldOptions extends IBaseFieldOptions {
    precision?: number,
    scale?: number,
    isDecimalConstraintMessage?: string,
    minDecimalConstraintMessage?: string,
    maxDecimalConstraintMessage?: string,
}

export const IS_DECIMAL_NUMBER = 'isDecimalNumber';

const IS_DECIMAL_NUMBER_DEFAULT_MESSAGE = 'Должно быть числом';
const buildMinDecimalDefaultMessage = (min: number) => `Должно быть не меньше ${min}`;
const buildMaxDecimalDefaultMessage = (max: number) => `Должно быть не больше ${max}`;

export function isDecimalNumber(value: unknown, options?: IDecimalNumberFieldOptions): boolean {
    if (typeof value !== 'number') { return false; }

    return isDecimal(value.toString(), {
        decimal_digits: '0,' + (options.scale ?? DEFAULT_DECIMAL_SCALE),
    });
}

export function IsDecimalNumber(
    options?: IDecimalNumberFieldOptions,
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return ValidateBy(
        {
            name: IS_DECIMAL_NUMBER,
            constraints: [options],
            validator: {
                validate: (value, args): boolean => isDecimalNumber(value, args?.constraints[0]),
                defaultMessage: buildMessage(
                    eachPrefix => eachPrefix + '$property is not a valid decimal number.',
                    validationOptions,
                ),
            },
        },
        validationOptions,
    );
}

export function DecimalNumberField(options: IDecimalNumberFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'DecimalNumberField',
            appType: 'decimal',
            jsType: 'number',
        }),
        Transform(({value}) => value ? Number(value) : value, TRANSFORM_TYPE_FROM_DB),
        options.nullable && ValidateIf((object, value) => value !== null && typeof value !== 'undefined'),
        IsDecimalNumber(options, {
            message: options.isDecimalConstraintMessage || IS_DECIMAL_NUMBER_DEFAULT_MESSAGE,
        }),
        typeof options.min === 'number' && Min(options.min, {
            each: options.isArray,
            message: options.minDecimalConstraintMessage || buildMinDecimalDefaultMessage(options.min),
        }),
        typeof options.max === 'number' && Max(options.max, {
            each: options.isArray,
            message: options.maxDecimalConstraintMessage || buildMaxDecimalDefaultMessage(options.max),
        }),
    ].filter(Boolean));
}
