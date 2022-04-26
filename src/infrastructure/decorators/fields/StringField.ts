import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IStringFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
    isStringConstraintMessage?: string,
    minConstraintMessage?: string,
    maxConstraintMessage?: string,
}

export function StringField(options: IStringFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'StringField',
            appType: 'string',
            jsType: 'string',
        }),
        Column({
            type: 'varchar',
            length: options.max,
            default: options.defaultValue,
            unique: options.unique,
            nullable: options.nullable,
        }),
        IsString({
            each: options.isArray,
            message: options.isStringConstraintMessage || 'Должна быть строка',
        }),
        !options.required && IsOptional(), // TODO check nullable and required
        typeof options.min === 'number' && MinLength(options.min, {
            message: options.minConstraintMessage
        }),
        typeof options.max === 'number' && MaxLength(options.max, {
            message: options.maxConstraintMessage
        }),
    ].filter(Boolean));
}
