import {applyDecorators} from '@nestjs/common';
import {IsPhoneNumber, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform} from '../Transform';

export interface IPhoneFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
    constraintMessage?: string,
}

export const normalizePhone = value => value
    ? String(value)
        .replace(/[^+\d]/g, '')
        .replace(/^8/, '+7')
        .replace(/^7/, '+7')
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
            options.nullable && ValidateIf((object, value) => value),
            Transform(({value}) => normalizePhone(value)),
            IsPhoneNumber(null, {
                message: options.constraintMessage || 'Некорректный номер телефона',
            }),
        ].filter(Boolean),
    );
}
