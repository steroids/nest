import {applyDecorators} from '@nestjs/common';
import {IsArray, IsInt, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export const SINGLE_FILE_DEFAULT_MESSAGE = 'Необходимо загрузить файл';
export const MULTIPLE_FILES_DEFAULT_MESSAGE = 'Необходимо загрузить файлы';
export const SINGLE_IMAGE_DEFAULT_MESSAGE = 'Необходимо загрузить изображение';
export const MULTIPLE_IMAGES_DEFAULT_MESSAGE = 'Необходимо загрузить изображения';

export interface IFileField extends IBaseFieldOptions {
    multiple?: boolean,
    isImage?: boolean,
    isFileConstraintMessage?: string,
}

export function getFileFieldDecorators(options: IFileField) {
    return [
        BaseField(options, {
            decoratorName: 'FileField',
            appType: 'file',
            jsType: 'number',
        }),
        options.nullable && ValidateIf((object, value) => value),
        options.multiple
            ? IsArray({
                message: options.isFileConstraintMessage
                    || (options.isImage ? MULTIPLE_IMAGES_DEFAULT_MESSAGE : MULTIPLE_FILES_DEFAULT_MESSAGE),
            })
            : IsInt({
                message: options.isFileConstraintMessage
                    || (options.isImage ? SINGLE_IMAGE_DEFAULT_MESSAGE : SINGLE_FILE_DEFAULT_MESSAGE),
            }),
    ].filter(Boolean);
}

export function FileField(options: IFileField = {}) {
    return applyDecorators(
        ...getFileFieldDecorators(options),
    );
}
