import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsString, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

interface IDecimalFieldOptions extends IBaseFieldOptions {
    precision?: number,
    scale?: number,
}

export function DecimalField(options: IDecimalFieldOptions = {}) {
    return applyDecorators(...[
        BaseField({
            ...options,
            decoratorName: 'DecimalField',
            appType: 'decimal',
        }),
        Column({
            type: 'decimal',
            default: options.defaultValue,
            nullable: options.nullable,
            precision: options.precision || 10,
            scale: options.scale || 2,
        }),
        options.nullable && ValidateIf((object, value) => value !== null),
        IsString(),
        ].filter(Boolean)
    );
}
