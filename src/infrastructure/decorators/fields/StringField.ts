import {applyDecorators} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {IsString, MaxLength, MinLength} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IStringFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
    isStringConstraintMessage?: string,
    minConstraintMessage?: string,
    maxConstraintMessage?: string,
}

const STRING_FIELD_DEFAULT_MAX_LENGTH = 250;

export function StringField(options: IStringFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'StringField',
            appType: 'string',
            jsType: 'string',
        }),
        IsString({
            each: options.isArray,
            message: options.isStringConstraintMessage || 'Должна быть строка',
        }),
        typeof options.min === 'number' && MinLength(options.min, {
            message: options.minConstraintMessage,
            each: options.isArray,
        }),
        typeof options.max === 'number' && MaxLength(_toInteger(options.max) || STRING_FIELD_DEFAULT_MAX_LENGTH, {
            message: options.maxConstraintMessage,
            each: options.isArray,
        }),
    ].filter(Boolean));
}
