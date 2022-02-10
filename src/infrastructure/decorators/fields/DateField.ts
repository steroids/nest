import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsDate} from 'class-validator';
import {Type} from 'class-transformer';
import {BaseField, IBaseFieldOptions} from './BaseField';

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
        }),
        IsDate(),
        Type(() => Date),
    );
}
