import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsString, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface ICoordinateFieldOptions extends IBaseFieldOptions {
    precision?: number,
    scale?: number,
}

export function CoordinateField(options: ICoordinateFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'CoordinateField',
            appType: 'decimal',
            jsType: 'number',
        }),
        Column({
            type: 'decimal',
            default: options.defaultValue,
            nullable: options.nullable,
            precision: options.precision || 12,
            scale: options.scale || 9,
        }),
        options.nullable && ValidateIf((object, value) => value !== null),
        IsString(),
        ].filter(Boolean)
    );
}
