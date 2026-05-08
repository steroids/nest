import {applyDecorators} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface ITextFieldOptions extends IBaseFieldOptions {
    isStringConstraintMessage?: string,
    minConstraintMessage?: string,
    maxConstraintMessage?: string,
}

const IS_STRING_DEFAULT_MESSAGE = 'Должна быть строка';
const buildMinLengthDefaultMessage = (min: number) => `Длина строки должна быть не менее ${min}`;
const buildMaxLengthDefaultMessage = (max: number) => `Длина строки должна быть не более ${max}`;

export function TextField(options: ITextFieldOptions = {}) {
    const maxLength = _toInteger(options.max);

    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'TextField',
            appType: 'text',
            jsType: 'string',
        }),
        IsString({
            each: options.isArray,
            message: options.isStringConstraintMessage || IS_STRING_DEFAULT_MESSAGE,
        }),
        !options.required && IsOptional(),
        typeof options.min === 'number' && MinLength(options.min, {
            message: options.minConstraintMessage || buildMinLengthDefaultMessage(options.min),
            each: options.isArray,
        }),
        typeof options.max === 'number' && MaxLength(maxLength, {
            message: options.maxConstraintMessage || buildMaxLengthDefaultMessage(maxLength),
            each: options.isArray,
        }),
    ].filter(Boolean));
}
