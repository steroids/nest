import {applyDecorators} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {IsString, MaxLength, MinLength, Matches, NotEquals} from 'class-validator';
import {BaseField, IArrayFieldOptions, IBaseFieldOptions} from './BaseField';
import {
    getArrayValidators,
    getConstraintValue,
} from './helpers/InternalFieldMetadataHelpers';

export interface IStringFieldOptions extends IBaseFieldOptions, IArrayFieldOptions {
    unique?: boolean,
    notEmpty?: boolean,
    notEmptyConstraintMessage?: string,
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
            swaggerType: 'string',
        }),
        ...getArrayValidators(options),
        getConstraintValue(options.notEmpty) && NotEquals('', {
            each: options.isArray,
            message: options.notEmptyConstraintMessage || 'Не должно быть пустым',
        }),
        IsString({
            each: options.isArray,
            message: options.isStringConstraintMessage || IS_STRING_DEFAULT_MESSAGE,
        }),
        options.regexp && Matches(
            options.regexp,
            {
                each: options.isArray,
                message: options.regexpErrorMessage || MATCHES_DEFAULT_MESSAGE,
            },
        ),
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
