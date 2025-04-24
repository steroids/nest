import {applyDecorators} from '@nestjs/common';
import {IsEmail} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IEmailFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
}

export function EmailField(options: IEmailFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Email';
    }

    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'EmailField',
            appType: 'email',
            jsType: 'string',
        }),
        IsEmail({
            allow_display_name: true,
        }, {
            message: 'Некорректный email адрес',
        }),
    ].filter(Boolean));
}
