import {applyDecorators} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {IsString, MaxLength, MinLength} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface ITextFieldOptions extends IBaseFieldOptions {
    isStringConstraintMessage?: string,
    minConstraintMessage?: string,
    maxConstraintMessage?: string,
}

export function TextField(options: ITextFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'TextField',
            appType: 'text',
            jsType: 'string',
        }),
        IsString({
            each: options.isArray,
            message: options.isStringConstraintMessage || 'Должна быть строка',
        }),
        typeof options.min === 'number' && MinLength(options.min, {
            message: `Длина строка должна быть не менее ${options.min}` || options.minConstraintMessage,
            each: options.isArray,
        }),
        typeof options.max === 'number' && MaxLength(_toInteger(options.max), {
            message: `Длина строка должна быть не более ${options.max}` || options.maxConstraintMessage,
            each: options.isArray,
        }),
    ].filter(Boolean));
}
