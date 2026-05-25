import {applyDecorators} from '@nestjs/common';
import {ApiPropertyOptions} from '@nestjs/swagger';
import {BaseField, IBaseFieldOptions, IRelationData} from './BaseField';
import {Computable, IComputableCallback} from '../Computable';

export interface IComputableFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
    requiredRelations?: Array<IRelationData | string>,
    callback?: IComputableCallback,
    // Use to manually define a field type in Swagger.
    // This must be used when overriding this field from the parent.
    swaggerType?: ApiPropertyOptions['type'];
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
