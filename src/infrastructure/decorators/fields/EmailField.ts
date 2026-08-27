import {applyDecorators} from '@nestjs/common';
import {IsEmail} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

const IS_EMAIL_DEFAULT_MESSAGE = 'Некорректный email адрес';

export interface IEmailFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
    isEmailConstraintMessage?: string,
}

export function EmailField(options: IEmailFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Email';
    }

    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'EmailField',
            appType: 'email',
            swaggerType: 'string',
        }),
        IsEmail({
            allow_display_name: true,
        }, {
            message: options.isEmailConstraintMessage || IS_EMAIL_DEFAULT_MESSAGE,
        }),
    ].filter(Boolean));
}
