import {applyDecorators} from '@nestjs/common';
import {has as _has} from 'lodash';
import {Column} from 'typeorm';
import {IsBoolean, IsOptional} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function BooleanField(options: IBaseFieldOptions = {}) {
    return applyDecorators(
        BaseField(options, {
            decoratorName: 'BooleanField',
            appType: 'boolean',
            jsType: 'boolean',
        }),
        Column({
            type: options.dbType || 'boolean',
            default: _has(options, 'defaultValue') ? options.defaultValue : false,
            nullable: _has(options, 'nullable') ? options.nullable : false,
        }),
        IsBoolean(),
        IsOptional(),
    );
}
