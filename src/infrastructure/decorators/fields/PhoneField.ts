import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsPhoneNumber, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform} from "class-transformer";

export interface IPhoneFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
}

export const normalizePhone = value => value
    ? String(value)
        .replace(/[^+\d]/g, '')
        .replace(/^8/, '+7')
        .replace(/^00/, '+')
    : value;

export function PhoneField(options: IPhoneFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Телефон';
    }

    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'PhoneField',
                appType: 'phone',
                jsType: 'string',
            }),
            Column({
                type: 'varchar',
                length: options.max || 16,
                default: options.defaultValue,
                unique: options.unique,
                nullable: options.nullable,
            }),
            options.nullable && ValidateIf((object, value) => value),
            Transform(({value}) => normalizePhone(value)),
            IsPhoneNumber(null, {
                message: 'Некорректный номер телефона',
            }),
        ].filter(Boolean)
    );
}
