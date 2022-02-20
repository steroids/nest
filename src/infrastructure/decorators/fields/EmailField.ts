import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsEmail} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IEmailFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
}

export function EmailField(options: IEmailFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Email';
    }

    return applyDecorators(
        BaseField(options,{
            decoratorName: 'EmailField',
            appType: 'email',
            jsType: 'string',
        }),
        Column({
            type: 'varchar',
            default: options.defaultValue,
            unique: options.unique,
            nullable: options.nullable,
        }),
        IsEmail({
            message: 'Некорректный email адрес',
        }),
    );
}
