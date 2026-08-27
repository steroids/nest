import {applyDecorators} from '@nestjs/common';
import {BaseField, IArrayFieldOptions, IBaseFieldOptions} from './BaseField';
import {getArrayValidators} from './helpers/InternalFieldMetadataHelpers';
import type {ISwaggerFieldType} from './helpers/InternalFieldMetadataHelpers';

export interface IJSONBFieldOptions extends IBaseFieldOptions, IArrayFieldOptions {
    // Use to manually define a field type in Swagger.
    swaggerType?: ISwaggerFieldType,
}

export function JSONBField(options: IJSONBFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'JSONBField',
            appType: 'object',
            swaggerType: options.swaggerType ?? 'string',
        }),
        ...getArrayValidators(options),
    ].filter(Boolean));
}
