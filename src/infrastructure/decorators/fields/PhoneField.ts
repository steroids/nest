import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsPhoneNumber} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform} from "class-transformer";

export interface IPhoneFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
}

const findCharsExceptPhoneSymbolsRegExp = /[^+\d]/g;

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
        Transform(({value}) => value ? value.replace(findCharsExceptPhoneSymbolsRegExp, '') : value),
        IsPhoneNumber(null, {
            message: 'Некорректный номер телефона',
        }),
    );
}
