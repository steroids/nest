import {applyDecorators} from '@nestjs/common';
import {IsOptional} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export type IJSONBFieldOptions = IBaseFieldOptions

export function JSONBField(options: IJSONBFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'JSONBField',
            appType: 'object',
            jsType: 'jsonb',
        }),
        !options.required && IsOptional(),
    ].filter(Boolean));
}
