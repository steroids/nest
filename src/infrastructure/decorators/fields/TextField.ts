import {applyDecorators} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {buildMaxLengthDefaultMessage, buildMinLengthDefaultMessage, IS_STRING_DEFAULT_MESSAGE} from './StringField';

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
            message: options.isStringConstraintMessage || IS_STRING_DEFAULT_MESSAGE,
        }),
        !options.required && IsOptional(),
        typeof options.min === 'number' && MinLength(options.min, {
            message: options.minConstraintMessage || buildMinLengthDefaultMessage(options.min),
            each: options.isArray,
        }),
        typeof options.max === 'number' && MaxLength(_toInteger(options.max), {
            message: options.maxConstraintMessage || buildMaxLengthDefaultMessage(options.max),
            each: options.isArray,
        }),
    ].filter(Boolean));
}
