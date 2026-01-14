import {applyDecorators} from '@nestjs/common';
import {IsDecimal, ValidateBy, ValidateIf, ValidationOptions} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IDecimalFieldOptions extends IBaseFieldOptions {
    precision?: number,
    scale?: number,
    isDecimalConstraintMessage?: string,
    minDecimalConstraintMessage?: string,
    maxDecimalConstraintMessage?: string,
}

export const MIN_STRING_AS_NUMBER = 'minStringAsNumber';

export const MAX_STRING_AS_NUMBER = 'maxStringAsNumber';

function buildValidate(
    constraint: number,
    validateFunction: (value: any, constraint: number) => boolean,
    validationOptions?: ValidationOptions,
) {
    return ValidateBy(
        {
            name: MIN_STRING_AS_NUMBER,
            constraints: [constraint],
            validator: {
                validate: (value, args): boolean => validateFunction(value, args?.constraints[0]),
            },
        },
        validationOptions,
    );
}

function stringMin(num: unknown, min: number): boolean {
    return typeof num === 'string' && typeof min === 'number' && Number(num) >= min;
}

function StringMin(minValue: number, validationOptions?: ValidationOptions): PropertyDecorator {
    return buildValidate(minValue, stringMin, validationOptions);
}

function stringMax(num: unknown, max: number): boolean {
    return typeof num === 'string' && typeof max === 'number' && Number(num) <= max;
}

function StringMax(maxValue: number, validationOptions?: ValidationOptions): PropertyDecorator {
    return buildValidate(maxValue, stringMax, validationOptions);
}

export function DecimalField(options: IDecimalFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'DecimalField',
            appType: 'decimal',
            jsType: 'number',
        }),
        options.nullable && ValidateIf((object, value) => value !== null && typeof value !== 'undefined'),
        IsDecimal({
            decimal_digits: options.scale ? String(options.scale) : '0,',
        }, {
            message: options.isDecimalConstraintMessage || 'Должно быть числом',
        }),
        typeof options.min === 'number' && StringMin(options.min, {
            each: options.isArray,
            message: options.minDecimalConstraintMessage || `Должно быть не меньше ${options.min}`,
        }),
        typeof options.max === 'number' && StringMax(options.max, {
            each: options.isArray,
            message: options.maxDecimalConstraintMessage || `Должно быть не больше ${options.max}`,
        }),
    ].filter(Boolean));
}
