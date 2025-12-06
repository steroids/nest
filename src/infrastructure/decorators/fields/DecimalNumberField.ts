import {applyDecorators} from '@nestjs/common';
import {Max, Min, ValidateBy, ValidationOptions, buildMessage, isDecimal} from 'class-validator';

import {IDecimalFieldOptions} from './DecimalField';
import {BaseField} from './BaseField';
import {TRANSFORM_TYPE_FROM_DB, Transform} from '../Transform';

export const IS_DECIMAL_NUMBER = 'isDecimalNumber';

export function isDecimalNumber(value: unknown, options?: IDecimalFieldOptions): boolean {
    if (typeof value !== 'number') { return false; }

    return isDecimal(value.toString(), {
        decimal_digits: '0,' + (options.scale ?? ''),
    });
}

export function IsDecimalNumber(
    options?: IDecimalFieldOptions,
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

export function DecimalNumberField(options: IDecimalFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'DecimalNumberField',
            appType: 'decimal',
            jsType: 'number',
        }),
        Transform(({value}) => value ? Number(value) : value, TRANSFORM_TYPE_FROM_DB),
        IsDecimalNumber(options, {
            message: options.isDecimalConstraintMessage || 'Должно быть числом',
        }),
        typeof options.min === 'number' && Min(options.min, {
            each: options.isArray,
            message: options.minDecimalConstraintMessage || `Должно быть не меньше ${options.min}`,
        }),
        typeof options.max === 'number' && Max(options.max, {
            each: options.isArray,
            message: options.maxDecimalConstraintMessage || `Должно быть не больше ${options.max}`,
        }),
    ].filter(Boolean));
}
