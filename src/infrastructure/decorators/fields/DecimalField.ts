import {applyDecorators} from '@nestjs/common';
import {Column} from '@steroidsjs/typeorm';
import {buildMessage, IsDecimal, ValidateBy, ValidateIf, ValidationOptions} from 'class-validator';
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

function stringMin(num: unknown, min: number): boolean {
    return typeof num === 'string' && typeof min === 'number' && Number(num) >= min;
}

function StringMin(minValue: number, validationOptions?: ValidationOptions): PropertyDecorator {
    return ValidateBy(
        {
            name: MIN_STRING_AS_NUMBER,
            constraints: [minValue],
            validator: {
                  validate: (value, args): boolean => stringMin(value, args?.constraints[0]),
                  defaultMessage: buildMessage(
                      eachPrefix => eachPrefix + '$property must not be less than $constraint1',
                        validationOptions
                  ),
            },
        },
        validationOptions
    );
}

function stringMax(num: unknown, max: number): boolean {
    return typeof num === 'string' && typeof max === 'number' && Number(num) <= max;
}

function StringMax(maxValue: number, validationOptions?: ValidationOptions): PropertyDecorator {
    return ValidateBy(
        {
            name: MAX_STRING_AS_NUMBER,
            constraints: [maxValue],
            validator: {
                validate: (value, args): boolean => stringMax(value, args?.constraints[0]),
                defaultMessage: buildMessage(
                    eachPrefix => eachPrefix + '$property must not be greater than $constraint1',
                    validationOptions
                ),
            },
        },
        validationOptions
    );
}

export function DecimalField(options: IDecimalFieldOptions = {}) {
    return applyDecorators(...[
            BaseField(options, {
                decoratorName: 'DecimalField',
                appType: 'decimal',
                jsType: 'number',
            }),
            Column({
                type: 'decimal',
                default: options.defaultValue,
                nullable: options.nullable,
                precision: options.precision || 10,
                scale: options.scale || 2,
            }),
            options.nullable && ValidateIf((object, value) => value !== null && typeof value !== 'undefined'),
            IsDecimal({
                decimal_digits: String(options.scale || 2),
            },{
                message: options.isDecimalConstraintMessage || 'Должно быть числом',
            }),
            typeof options.min === 'number' && StringMin(options.min, {
                each: options.isArray,
                message: `Должно быть не меньше ${options.min}` || options.minDecimalConstraintMessage,
            }),
            typeof options.max === 'number' && StringMax(options.max, {
                each: options.isArray,
                message: `Должно быть не больше ${options.max}` || options.maxDecimalConstraintMessage,
            }),
        ].filter(Boolean)
    );
}
