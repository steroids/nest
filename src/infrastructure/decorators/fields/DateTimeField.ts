import {applyDecorators} from '@nestjs/common';
import {has as _has} from 'lodash';
import {Column} from 'typeorm';
import {IsDate} from 'class-validator';
import {Type} from 'class-transformer';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {formatISO9075, parseISO} from 'date-fns';

export const normalizeDateTime = value => {
    if (!value) {
        return null;
    }
    if (typeof value === 'string') {
        value = parseISO(value);
    }

    return formatISO9075(value);
};

export interface IDateTimeFieldColumnOptions extends IBaseFieldOptions {
    precision?: number,
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
            transformer: {
                from: normalizeDateTime,
                to: normalizeDateTime,
            },
        }),
        IsDate({
            message: 'Некорректный формат даты',
        }),
        Type(() => Date),
    );
}
