import {applyDecorators} from '@nestjs/common';
import {Column} from '@steroidsjs/typeorm';
import {ValidateIf} from 'class-validator';
import {ValidateBy, ValidationOptions, buildMessage, isDecimal} from 'class-validator';
import { IDecimalFieldOptions } from './DecimalField';
import { BaseField } from './BaseField';
import { TRANSFORM_TYPE_FROM_DB, Transform } from '../Transform';

export const IS_DECIMAL_NUMBER = 'isDecimalNumber';

export function isDecimalNumber(value: unknown, options?: IDecimalFieldOptions): boolean {
    if (typeof value !== 'number') { return false; }

    return isDecimal(value.toString(), {
        decimal_digits: options.scale ? ('0,' + options.scale) : '1,',
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
        Column({
            type: 'decimal',
            default: options.defaultValue,
            nullable: options.nullable,
            precision: options.precision || 10,
            scale: options.scale || 2,
        }),
        Transform(({value}) => value ? Number(value) : value, TRANSFORM_TYPE_FROM_DB),
        options.nullable && ValidateIf((object, value) => value !== null && typeof value !== 'undefined'),
        IsDecimalNumber(options, {
            message: options.isDecimalConstraintMessage || 'Должно быть числом',
        }),
    ].filter(Boolean));
}
