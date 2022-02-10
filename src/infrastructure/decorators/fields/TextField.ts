import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function TextField(options: IBaseFieldOptions = {}) {
    return applyDecorators(
        BaseField(options, {
            decoratorName: 'TextField',
            appType: 'text',
            jsType: 'string',
        }),
        Column({
            type: 'text',
            length: options.max,
            default: options.defaultValue,
            nullable: options.nullable,
        }),
    );
}
