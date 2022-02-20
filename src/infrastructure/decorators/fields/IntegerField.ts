import {applyDecorators} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {Column} from 'typeorm';
import {IsInt, IsNumberString, Max, Min, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform} from 'class-transformer';

export interface IIntegerFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
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
        options.nullable && ValidateIf((object, value) => value !== null),
        Transform(({value}) => value === null ? value : _toInteger(value)),
        IsInt({
            message: 'Должно быть числом',
        }),
        typeof options.min === 'number' && Min(options.min),
        typeof options.max === 'number' && Max(options.max),
    ].filter(Boolean));
}
