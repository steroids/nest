import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsPhoneNumber} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IPhoneFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
}

export function PhoneField(options: IPhoneFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Телефон';
    }

    return applyDecorators(
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
        IsPhoneNumber(null, {
            message: 'Некорректный номер телефона',
        }),
    );
}
