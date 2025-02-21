import {applyDecorators} from '@nestjs/common';
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
    );
}
