import {applyDecorators} from '@nestjs/common';
import {IsArray, IsInt} from 'class-validator';
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
        ...getFileFieldDecorators(options),
    );
}
