import {applyDecorators} from '@nestjs/common';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IRelationIdFieldOptions extends IBaseFieldOptions {
    relationName?: string,
}

export function RelationIdField(options: IRelationIdFieldOptions = {}) {
    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'RelationIdField',
                appType: 'relationId',
                jsType: 'number',
            }),
        ].filter(Boolean)
    );
}
