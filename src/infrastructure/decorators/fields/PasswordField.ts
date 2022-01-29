import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {Exclude} from 'class-transformer';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function PasswordField(options: IBaseFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Пароль';
    }

    return applyDecorators(
        BaseField({
            ...options,
            decoratorName: 'PasswordField',
            appType: 'password',
        }),
        Column({
            type: 'text',
            length: options.max,
            default: options.defaultValue,
            nullable: options.nullable,
        }),
        // TODO
        // Exclude({toPlainOnly: true}),
    );
}
