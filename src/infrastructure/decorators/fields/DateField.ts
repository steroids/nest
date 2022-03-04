import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsISO8601} from 'class-validator';
import {formatISO9075, parseISO} from 'date-fns';
import {BaseField, IBaseFieldOptions} from './BaseField';

export const normalizeDate = value => {
    if (!value) {
        return null;
    }
    if (typeof value === 'string') {
        value = parseISO(value);
    }

    return formatISO9075(value, { representation: 'date' });
};

export function DateField(options: IBaseFieldOptions = {}) {
    return applyDecorators(
        BaseField(options, {
            decoratorName: 'DateField',
            appType: 'date',
            jsType: 'string',
        }),
        Column({
            type: 'date',
            default: options.defaultValue,
            nullable: options.nullable,
            transformer: {
                from: normalizeDate,
                to: normalizeDate,
            },
        }),
        IsISO8601({
            message: 'Некорректный формат даты',
        }),
        //Type(() => Date),
    );
}
