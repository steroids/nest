import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsArray, IsInt, IsOptional} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IFileField extends IBaseFieldOptions {
    multiple?: boolean,
}

export function FileField(options: IFileField = {}) {
    return applyDecorators(
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
        IsOptional(),
        options.multiple ? IsArray() : IsInt(),
    );
}
