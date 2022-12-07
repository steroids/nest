import {applyDecorators} from '@nestjs/common';
import {BaseField, IBaseFieldOptions, IRelationData} from './BaseField';
import {Computable} from '../Computable';

export interface IComputableFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
    requiredRelations?: Array<IRelationData | string>,
    callback?: any,
}

export function ComputableField(options: IComputableFieldOptions) {

    return applyDecorators(
        ...[
            BaseField(options,{
                decoratorName: 'ComputableField',
                appType: 'computable',
                jsType: options.jsType,
            }),
            Computable(options.callback)
        ].filter(Boolean),
    );
}
