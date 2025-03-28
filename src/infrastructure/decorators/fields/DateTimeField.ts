import {applyDecorators} from '@nestjs/common';
//import {IsDateString, ValidateIf} from 'class-validator';
import {Type} from 'class-transformer';
import {format, parseISO} from 'date-fns';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';

export const normalizeDateTime = (value, skipSeconds = true) => value
    ? format(
        typeof value === 'string'
            ? parseISO(value)
            : value,
        'yyyy-MM-dd HH:mm' + (!skipSeconds ? ':ss' : ''),
    )
    : value;

export interface IDateTimeFieldColumnOptions extends IBaseFieldOptions {
    precision?: number,
    skipSeconds?: boolean,
}

export function DateTimeField(options: IDateTimeFieldColumnOptions = {}) {
    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'DateTimeField',
                appType: 'dateTime',
                jsType: 'string',
            }),
            // options.nullable && ValidateIf((object, value) => value !== null && typeof value !== 'undefined'),
            // IsDateString({
            //     message: 'Некорректный формат даты',
            // }),
            Type(() => Date),
            Transform(
                ({value}) => normalizeDateTime(value, options.skipSeconds),
                TRANSFORM_TYPE_FROM_DB,
            ),
            Transform(
                ({value}) => normalizeDateTime(value, options.skipSeconds),
                TRANSFORM_TYPE_TO_DB,
            ),
        ].filter(Boolean),
    );
}
