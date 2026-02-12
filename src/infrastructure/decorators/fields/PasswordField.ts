import {applyDecorators} from '@nestjs/common';
import {IsStrongPassword} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IPasswordFieldOptions extends IBaseFieldOptions {
    minLength?: number,
    minLowercase?: number,
    minUppercase?: number,
    minNumbers?: number,
    minSymbols?: number,
    isStrongPasswordConstraintMessage?: string,
}

export function PasswordField(options: IPasswordFieldOptions = {}) {
    const finalOptions: IPasswordFieldOptions = {
        label: 'Пароль',
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0,
        isStrongPasswordConstraintMessage: 'Ненадёжный пароль',
        ...options,
    };

    return applyDecorators(
        BaseField(finalOptions, {
            decoratorName: 'PasswordField',
            appType: 'password',
            jsType: 'string',
        }),
        IsStrongPassword({
            minLength: finalOptions.minLength,
            minLowercase: finalOptions.minLowercase,
            minUppercase: finalOptions.minUppercase,
            minNumbers: finalOptions.minNumbers,
            minSymbols: finalOptions.minSymbols,
        }, {
            each: finalOptions.isArray,
            message: finalOptions.isStrongPasswordConstraintMessage,
        }),
    );
}
