import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsISO8601, ValidateIf} from 'class-validator';
import {formatISO9075, parseISO} from 'date-fns';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';

export const normalizeDate = value => {
    if (!value) {
        return value;
    }
    if (typeof value === 'string') {
        value = parseISO(value);
    }

    return formatISO9075(value, { representation: 'date' });
};

export function DateField(options: IBaseFieldOptions = {}) {
    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'DateField',
                appType: 'date',
                jsType: 'string',
            }),
            Column({
                type: 'date',
                default: options.defaultValue,
                nullable: options.nullable,
            }),
            Transform(({value}) => normalizeDate(value), TRANSFORM_TYPE_FROM_DB),
            Transform(({value}) => normalizeDate(value), TRANSFORM_TYPE_TO_DB),
            options.nullable && ValidateIf((object, value) => value),
            IsISO8601({
                message: 'Некорректный формат даты',
            }),
        ].filter(Boolean)
    );
}
