import {applyDecorators} from '@nestjs/common';
import {IsISO8601, ValidateIf, ValidationArguments} from 'class-validator';
import {formatISO9075, parseISO} from 'date-fns';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';
import {MinDate} from '../validators/MinDate';
import {MaxDate} from '../validators/MaxDate';

export const normalizeDate = (rawValue) => {
    if (!rawValue) {
        return rawValue;
    }

    let value = rawValue;
    if (typeof value === 'string') {
        value = parseISO(rawValue);
    }

    try {
        return formatISO9075(value, {representation: 'date'});
    } catch (e) {
        return null;
    }
};

export const normalizeFunctionDate = (value, args?: ValidationArguments) => {
    if (typeof value === 'function') {
        value = value(args);
    }

    return normalizeDate(value);
};

const IS_ISO_8601_DEFAULT_MESSAGE = 'Некорректный формат даты';
const MIN_DATE_DEFAULT_MESSAGE_PREFIX = 'Выбрана дата раньше минимально допустимой';
const MAX_DATE_DEFAULT_MESSAGE_PREFIX = 'Выбрана дата позже максимально допустимой';

type DateConstraintMessage = string | ((args: ValidationArguments) => string);

export interface IDateFieldOptions extends IBaseFieldOptions {
    minDate?: string | Date | Function,
    maxDate?: string | Date | Function,
    minDateConstraintMessage?: DateConstraintMessage,
    maxDateConstraintMessage?: DateConstraintMessage,
    isISO8601ConstraintMessage?: string,
}

export function DateField(options: IDateFieldOptions = {}) {
    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'DateField',
                appType: 'date',
                jsType: 'string',
            }),
            Transform(({value}) => normalizeDate(value), TRANSFORM_TYPE_FROM_DB),
            Transform(({value}) => normalizeDate(value), TRANSFORM_TYPE_TO_DB),
            options.nullable && ValidateIf((object, value) => value),
            options.minDate && MinDate(options.minDate, {
                each: options.isArray,
                message: options.minDateConstraintMessage
                    || ((args) => `${MIN_DATE_DEFAULT_MESSAGE_PREFIX} (${normalizeFunctionDate(options.minDate, args)})`),
            }),
            options.maxDate && MaxDate(options.maxDate, {
                each: options.isArray,
                message: options.maxDateConstraintMessage
                    || ((args) => `${MAX_DATE_DEFAULT_MESSAGE_PREFIX} (${normalizeFunctionDate(options.maxDate, args)})`),
            }),
            IsISO8601({}, {
                message: options.isISO8601ConstraintMessage || IS_ISO_8601_DEFAULT_MESSAGE,
            }),
        ].filter(Boolean),
    );
}
