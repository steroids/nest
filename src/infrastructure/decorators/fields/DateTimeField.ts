import {applyDecorators} from '@nestjs/common';
import {has as _has} from 'lodash';
import {Column} from 'typeorm';
import {IsDate} from 'class-validator';
import {Type} from 'class-transformer';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {formatISO9075, parseISO} from 'date-fns';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';

export const normalizeDateTime = value => {
    if (!value) {
        return value;
    }
    if (typeof value === 'string') {
        value = parseISO(value);
    }

    return formatISO9075(value);
};

export interface IDateTimeFieldColumnOptions extends IBaseFieldOptions {
    precision?: number,
}

export const dateTimeTransformFromDb = ({value}) => {
    return normalizeDateTime(value);
}

export const dateTimeTransformToDb = ({value}) => {
    return normalizeDateTime(value);
}

export function DateTimeField(options: IDateTimeFieldColumnOptions = {}) {
    return applyDecorators(
        BaseField(options, {
            decoratorName: 'DateTimeField',
            appType: 'dateTime',
            jsType: 'string',
        }),
        Column({
            type: 'timestamp',
            precision: _has(options, 'precision') ? options.precision : 0,
            default: options.defaultValue,
            nullable: options.nullable,
        }),
        IsDate({
            message: 'Некорректный формат даты',
        }),
        Type(() => Date),
        Transform(dateTimeTransformFromDb, TRANSFORM_TYPE_FROM_DB),
        Transform(dateTimeTransformToDb, TRANSFORM_TYPE_TO_DB),
    );
}
