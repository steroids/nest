import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm-steroids';
import {IsMilitaryTime, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function TimeField(options: IBaseFieldOptions = {}) {
    return applyDecorators(
        ...[
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
            options?.nullable && ValidateIf((object, value) => value !== null),
            IsMilitaryTime({
                message: 'Время необходимо ввести в формате часы:минуты, например 07:32'
            }),
        ].filter(Boolean)
    );
}
