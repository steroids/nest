import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm-steroids';
import {IsDecimal, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IDecimalFieldOptions extends IBaseFieldOptions {
    precision?: number,
    scale?: number,
    isDecimalConstraintMessage?: string,
}

export function DecimalField(options: IDecimalFieldOptions = {}) {
    return applyDecorators(...[
            BaseField(options, {
                decoratorName: 'DecimalField',
                appType: 'decimal',
                jsType: 'number',
            }),
            Column({
                type: 'decimal',
                default: options.defaultValue,
                nullable: options.nullable,
                precision: options.precision || 10,
                scale: options.scale || 2,
            }),
            options.nullable && ValidateIf((object, value) => value !== null && typeof value !== 'undefined'),
            IsDecimal({
                decimal_digits: options.scale || 2,
            },{
                message: options.isDecimalConstraintMessage || 'Должно быть числом',
            }),
        ].filter(Boolean)
    );
}
