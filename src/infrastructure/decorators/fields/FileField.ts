import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsInt} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function FileField(options: IBaseFieldOptions = {}) {
    return applyDecorators(
        BaseField({
            ...options,
            decoratorName: 'FileField',
            appType: 'file',
        }),
        Column({
            type: 'integer',
            default: options.defaultValue,
            nullable: options.nullable,
        }),
        IsInt(),
    );
}
