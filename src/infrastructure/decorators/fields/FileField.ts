import {applyDecorators} from '@nestjs/common';
import {IsInt} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IFileField extends IBaseFieldOptions {
    isImage?: boolean,
}

export function getFileFieldDecorators(options: IFileField) {
    const finalOptions: IBaseFieldOptions = {
        ...options,
        isArrayConstraintMessage: options.isArrayConstraintMessage
            || (options.isArray && (options.isImage ? 'Необходимо загрузить изображения' : 'Необходимо загрузить файлы')),
    };

    return [
        BaseField(finalOptions, {
            decoratorName: 'FileField',
            appType: 'file',
            swaggerType: 'number',
        }),
        !finalOptions.isArray && IsInt({
            message: options.isImage ? 'Необходимо загрузить изображение' : 'Необходимо загрузить файл',
        }),
    ].filter(Boolean);
}

export function FileField(options: IFileField = {}) {
    return applyDecorators(
        ...getFileFieldDecorators(options),
    );
}
