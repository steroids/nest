import {applyDecorators} from '@nestjs/common';
import {Column} from '@steroidsjs/typeorm';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function PasswordField(options: IBaseFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Пароль';
    }

    return applyDecorators(
        BaseField(options, {
            decoratorName: 'PasswordField',
            appType: 'password',
            jsType: 'string',
        }),
        Column({
            type: 'text',
            length: options.max,
            default: options.defaultValue,
            nullable: options.nullable,
        }),
    );
}
