import {applyDecorators} from '@nestjs/common';
import {Column} from '@steroidsjs/typeorm';
import {IsArray, IsInt, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IFileField extends IBaseFieldOptions {
    multiple?: boolean,
    isImage?: boolean,
}

export function getFileFieldDecorators(options: IFileField) {
    return [
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
        options.multiple
            ? IsArray({
                message: options.isImage ? 'Необходимо загрузить изображения' : 'Необходимо загрузить файлы',
            })
            : IsInt({
                message: options.isImage ? 'Необходимо загрузить изображение' : 'Необходимо загрузить файл',
            }),
    ].filter(Boolean);
}

export function FileField(options: IFileField = {}) {
    return applyDecorators(
        ...getFileFieldDecorators(options)
    );
}
