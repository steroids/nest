import {applyDecorators} from '@nestjs/common';
import {has as _has} from 'lodash';
import {Column} from 'typeorm';
import {IsDate} from 'class-validator';
import {Type} from 'class-transformer';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IDateTimeFieldColumnOptions extends IBaseFieldOptions {
    precision?: number,
}

export function DateTimeField(options: IDateTimeFieldColumnOptions = {}) {
    return applyDecorators(
        BaseField({
            ...options,
            decoratorName: 'DateTimeField',
            appType: 'dateTime',
        }),
        Column({
            type: 'timestamp',
            precision: _has(options, 'precision') ? options.precision : 0,
            default: options.defaultValue,
            nullable: options.nullable,
            // transformer: {
            //     from(value: any): any {
            //         console.log(value);
            //         return value;
            //     },
            // },
        }),
        IsDate(),
        Type(() => Date),
    );
}
