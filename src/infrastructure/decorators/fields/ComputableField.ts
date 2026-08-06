import {applyDecorators} from '@nestjs/common';
import {BaseField, IBaseFieldOptions, IRelationData} from './BaseField';
import {Computable, IComputableCallback} from '../Computable';
import type {ISwaggerFieldType} from './helpers/InternalFieldMetadataHelpers';

export interface IComputableFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
    requiredRelations?: Array<IRelationData | string>,
    callback?: IComputableCallback,
    // Use to manually define a field type in Swagger.
    // This must be used when overriding this field from the parent.
    swaggerType?: ISwaggerFieldType,
}

export function ComputableField(options: IComputableFieldOptions) {
    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'ComputableField',
                appType: 'computable',
                swaggerType: options.swaggerType,
            }),
            Computable(options.callback),
        ].filter(Boolean),
    );
}
