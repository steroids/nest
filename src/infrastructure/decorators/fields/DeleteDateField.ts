import {applyDecorators} from '@nestjs/common';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';
import {normalizeDate} from './DateField';

export function DeleteDateField(options: IBaseFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'DeleteDateField',
            appType: 'date',
            jsType: 'string',
        }),
        Transform(({value}) => normalizeDate(value), TRANSFORM_TYPE_FROM_DB),
        Transform(({value}) => normalizeDate(value), TRANSFORM_TYPE_TO_DB),
    ].filter(Boolean));
}
