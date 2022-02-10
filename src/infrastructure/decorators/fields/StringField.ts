import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function StringField(options: IBaseFieldOptions = {}) {
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
            nullable: options.nullable,
        }),
        IsString(),
        IsOptional(), // TODO check nullable and required
        typeof options.min === 'number' && MinLength(options.min),
        typeof options.max === 'number' && MaxLength(options.max),
    ].filter(Boolean));
}
