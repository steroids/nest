import {applyDecorators} from '@nestjs/common';
import {Type} from 'class-transformer';
import {format, parseISO} from 'date-fns';
import {BaseField, IArrayFieldOptions, IBaseFieldOptions} from './BaseField';
import {Transform, transformValueOrArray, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';
import {getArrayValidators} from './helpers/InternalFieldMetadataHelpers';

export const normalizeDateTime = (value, skipSeconds = false) => value
    ? format(
        typeof value === 'string'
            ? parseISO(value)
            : value,
        'yyyy-MM-dd HH:mm' + (!skipSeconds ? ':ss' : ''),
    )
    : value;

export interface IDateTimeFieldColumnOptions extends IBaseFieldOptions, IArrayFieldOptions {
    precision?: number,
    skipSeconds?: boolean,
}

export function DateTimeField(options: IDateTimeFieldColumnOptions = {}) {
    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'DateTimeField',
                appType: 'dateTime',
                swaggerType: 'string',
            }),
            ...getArrayValidators(options),
            // IsDateString({
            //     message: 'Некорректный формат даты',
            // }),
            Type(() => Date),
            Transform(
                ({value}) => transformValueOrArray(value, item => normalizeDateTime(item, options.skipSeconds)),
                TRANSFORM_TYPE_FROM_DB,
            ),
            Transform(
                ({value}) => transformValueOrArray(value, item => normalizeDateTime(item, options.skipSeconds)),
                TRANSFORM_TYPE_TO_DB,
            ),
        ].filter(Boolean),
    );
}
