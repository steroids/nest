import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsMilitaryTime} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function TimeField(options: IBaseFieldOptions = {}) {
    return applyDecorators(
        BaseField(options, {
            decoratorName: 'TimeField',
            appType: 'time',
            jsType: 'string',
        }),
        Column({
            type: 'varchar',
            length: 5,
            default: options.defaultValue,
            nullable: options.nullable,
        }),
        IsMilitaryTime(),
    );
}
