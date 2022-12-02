import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {ArrayUnique, IsEmail, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform, TRANSFORM_TYPE_COMPUTABLE} from '../Transform';
import {IComputableCallback} from '../Computable';

export interface IComputableFieldOptions extends IBaseFieldOptions {
    unique?: boolean,
    relationName?: string,
    relationClass?: () => any,
    callback?: () => any
}

export function ComputableField(options: IComputableFieldOptions) {

    return applyDecorators(
        ...[
            BaseField(options,{
                decoratorName: 'ComputableField',
                appType: 'computable',
                jsType: options.jsType,
            }),
            (
                callback: IComputableCallback,
                transformType = TRANSFORM_TYPE_COMPUTABLE,
            ) => Transform(callback, transformType),
        ].filter(Boolean),
    );
}
