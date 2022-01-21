import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsNumber} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

interface ICoordinateFieldOptions extends IBaseFieldOptions {
    precision?: number,
    scale?: number,
}

export function CoordinateField(options: ICoordinateFieldOptions = {}) {
    return applyDecorators(
        BaseField({
            ...options,
            decoratorName: 'CoordinateField',
            appType: 'decimal',
        }),
        Column({
            type: 'decimal',
            default: options.defaultValue,
            nullable: options.nullable,
            precision: options.precision || 12,
            scale: options.scale || 9,
        }),
        IsNumber(),
    );
}
