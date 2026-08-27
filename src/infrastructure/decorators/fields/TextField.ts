import {applyDecorators} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {IsString, MaxLength, MinLength, NotEquals} from 'class-validator';
import {BaseField, IArrayFieldOptions, IBaseFieldOptions} from './BaseField';
import {getArrayValidators, getConstraintValue} from './helpers/InternalFieldMetadataHelpers';

export interface ITextFieldOptions extends IBaseFieldOptions, IArrayFieldOptions {
    notEmpty?: boolean,
    notEmptyConstraintMessage?: string,
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
