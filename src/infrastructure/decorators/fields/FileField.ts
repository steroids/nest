import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsArray, IsInt, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IFileField extends IBaseFieldOptions {
    multiple?: boolean,
}

export function FileField(options: IFileField = {}) {
    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'FileField',
                appType: 'file',
                jsType: 'number',
            }),
            Column({
                type: options.multiple ? 'simple-array' : 'integer',
                default: options.defaultValue,
                nullable: options.nullable,
            }),
            options.nullable && ValidateIf((object, value) => value),
            options.multiple ? IsArray() : IsInt(),
        ].filter(Boolean)
    );
}
