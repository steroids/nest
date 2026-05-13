import {applyDecorators} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {IsOptional, IsString, MaxLength, MinLength, Matches} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IStringFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
    isStringConstraintMessage?: string,
    minConstraintMessage?: string,
    maxConstraintMessage?: string,
    regexp?: RegExp,
    regexpErrorMessage?: string,
}

const STRING_FIELD_DEFAULT_MAX_LENGTH = 250;

const IS_STRING_DEFAULT_MESSAGE = 'Должна быть строка';
const MATCHES_DEFAULT_MESSAGE = 'Не корректный формат строки';
const buildMinLengthDefaultMessage = (min: number) => `Длина строки должна быть не менее ${min}`;
const buildMaxLengthDefaultMessage = (max: number) => `Длина строки должна быть не более ${max}`;

export function StringField(options: IStringFieldOptions = {}) {
    const maxLength = _toInteger(options.max) || STRING_FIELD_DEFAULT_MAX_LENGTH;

    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'StringField',
            appType: 'string',
            jsType: 'string',
        }),
        IsString({
            each: options.isArray,
            message: options.isStringConstraintMessage || IS_STRING_DEFAULT_MESSAGE,
        }),
        options.regexp && Matches(
            options.regexp,
            {
                message: options.regexpErrorMessage || MATCHES_DEFAULT_MESSAGE,
            },
        ),
        !options.required && IsOptional(), // TODO check nullable and required
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
