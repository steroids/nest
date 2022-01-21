import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function HtmlField(options: IBaseFieldOptions = {}) {
    return applyDecorators(
        BaseField({
            ...options,
            decoratorName: 'HtmlField',
            appType: 'html',
        }),
        Column({
            type: 'text',
            default: options.defaultValue,
            nullable: options.nullable,
        }),
    );
}
