import {applyDecorators} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {Column} from 'typeorm';
import {IsInt, Max, Min, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform} from 'class-transformer';

export interface IIntegerFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
    isIntConstraintMessage?: string,
}

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
        options.nullable && ValidateIf((object, value) => value !== null && typeof value !== 'undefined'),
        Transform(({value}) => {
            if (Array.isArray(value)) {
                return value.map(valueItem => _toInteger(valueItem));
            }
            return value === null ? value : _toInteger(value);
        }),
        IsInt({
            message: options.isIntConstraintMessage || 'Должно быть числом',
            each: options.isArray,
        }),
        typeof options.min === 'number' && Min(options.min),
        typeof options.max === 'number' && Max(options.max),
    ].filter(Boolean));
}
