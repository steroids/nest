import {applyDecorators} from '@nestjs/common';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {normalizeDateTime} from './DateTimeField';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';

export interface ICreateTimeFieldOptions extends IBaseFieldOptions {
    precision?: number,
}

export function CreateTimeField(options: ICreateTimeFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Создан';
    }

    return applyDecorators(
        BaseField(options, {
            decoratorName: 'CreateTimeField',
            appType: 'createTime',
            jsType: 'string',
        }),
        Transform(({value}) => normalizeDateTime(value, false), TRANSFORM_TYPE_FROM_DB),
        Transform(({value}) => normalizeDateTime(value, false), TRANSFORM_TYPE_TO_DB),
    );
}
