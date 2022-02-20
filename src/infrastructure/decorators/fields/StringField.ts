import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsOptional, IsString, MaxLength, MinLength, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IStringFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
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
            message: 'Должна быть строка',
        }),
        IsOptional(), // TODO check nullable and required
        typeof options.min === 'number' && MinLength(options.min),
        typeof options.max === 'number' && MaxLength(options.max),
    ].filter(Boolean));
}
