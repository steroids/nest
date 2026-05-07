import {applyDecorators} from '@nestjs/common';
import {IsOptional, IsString} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {normalizeDateTime} from './DateTimeField';
import {IS_STRING_DEFAULT_MESSAGE} from './StringField';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';

export interface IUpdateTimeFieldOptions extends IBaseFieldOptions {
    precision?: number,
    isStringConstraintMessage?: string,
}

export function UpdateTimeField(options: IUpdateTimeFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Обновлен';
    }

    return applyDecorators(
        BaseField(options, {
            decoratorName: 'UpdateTimeField',
            appType: 'updateTime',
            jsType: 'string',
        }),
        Transform(({value}) => normalizeDateTime(value, false), TRANSFORM_TYPE_FROM_DB),
        Transform(() => normalizeDateTime(new Date(), false), TRANSFORM_TYPE_TO_DB),
        IsOptional(),
        IsString({
            message: options.isStringConstraintMessage || IS_STRING_DEFAULT_MESSAGE,
        }),
    );
}
