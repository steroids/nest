import {applyDecorators} from '@nestjs/common';
import {IsString, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {IS_STRING_DEFAULT_MESSAGE} from './StringField';

export interface ICoordinateFieldOptions extends IBaseFieldOptions {
    precision?: number,
    scale?: number,
    isStringConstraintMessage?: string,
}

export function CoordinateField(options: ICoordinateFieldOptions = {}) {
    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'CoordinateField',
                appType: 'decimal',
                jsType: 'number',
            }),
            options.nullable && ValidateIf((object, value) => value !== null),
            IsString({
                message: options.isStringConstraintMessage || IS_STRING_DEFAULT_MESSAGE,
            }),
        ].filter(Boolean),
    );
}
