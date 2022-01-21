import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsNumber} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

interface IDecimalFieldOptions extends IBaseFieldOptions {
    precision?: number,
    scale?: number,
}

export function DecimalField(options: IDecimalFieldOptions = {}) {
    return applyDecorators(
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
        IsNumber(),
    );
}
