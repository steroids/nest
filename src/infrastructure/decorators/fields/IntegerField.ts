import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsInt, Max, Min} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function IntegerField(options: IBaseFieldOptions = {}) {
    return applyDecorators(...[
        BaseField({
            ...options,
            decoratorName: 'IntegerField',
            appType: 'integer',
        }),
        Column({
            type: 'integer',
            default: options.defaultValue,
            nullable: options.nullable,
        }),
        IsInt(),
        typeof options.min === 'number' && Min(options.min),
        typeof options.max === 'number' && Max(options.max),
    ].filter(Boolean));
}
