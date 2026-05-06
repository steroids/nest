import {applyDecorators} from '@nestjs/common';
import {ApiPropertyOptions} from '@nestjs/swagger';
import {IsOptional} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IJSONBFieldOptions extends IBaseFieldOptions {
    // Use to manually define a field type in Swagger.
    swaggerType?: ApiPropertyOptions['type'];
}

export function JSONBField(options: IJSONBFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'JSONBField',
            appType: 'object',
            swaggerType: options.swaggerType ?? 'string',
        }),
        !options.required && IsOptional(),
    ].filter(Boolean));
}
