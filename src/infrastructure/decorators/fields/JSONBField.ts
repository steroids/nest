import {applyDecorators} from '@nestjs/common';
import {Column} from '@steroidsjs/typeorm';
import {IsOptional} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IJSONBFieldOptions extends IBaseFieldOptions {}

export function JSONBField(options: IJSONBFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'JSONBField',
            appType: 'object',
            jsType: 'jsonb',
        }),
        Column({
            type: 'jsonb',
            length: options.max,
            default: options.defaultValue,
            nullable: options.nullable,
            array: options.isArray,
        }),
        !options.required && IsOptional(),
    ].filter(Boolean));
}
