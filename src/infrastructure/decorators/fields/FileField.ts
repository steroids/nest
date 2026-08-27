import {applyDecorators} from '@nestjs/common';
import {IsInt} from 'class-validator';
import {BaseField, IArrayFieldOptions, IBaseFieldOptions} from './BaseField';
import {getArrayValidators} from './helpers/InternalFieldMetadataHelpers';

const SINGLE_FILE_DEFAULT_MESSAGE = 'Необходимо загрузить файл';
const MULTIPLE_FILES_DEFAULT_MESSAGE = 'Необходимо загрузить файлы';
const SINGLE_IMAGE_DEFAULT_MESSAGE = 'Необходимо загрузить изображение';
const MULTIPLE_IMAGES_DEFAULT_MESSAGE = 'Необходимо загрузить изображения';

export interface IFileField extends IBaseFieldOptions, IArrayFieldOptions {
    isImage?: boolean,
    isFileConstraintMessage?: string,
}

export function getFileFieldDecorators(options: IFileField) {
    const finalOptions: IBaseFieldOptions & IArrayFieldOptions = {
        ...options,
        isArrayConstraintMessage: options.isArrayConstraintMessage
            || (options.isArray && (options.isImage
                ? MULTIPLE_IMAGES_DEFAULT_MESSAGE
                : MULTIPLE_FILES_DEFAULT_MESSAGE)),
    };

    return [
        BaseField(finalOptions, {
            decoratorName: 'FileField',
            appType: 'file',
            swaggerType: 'number',
        }),
        ...getArrayValidators(finalOptions),
        !finalOptions.isArray && IsInt({
            message: options.isFileConstraintMessage
                || (options.isImage
                    ? SINGLE_IMAGE_DEFAULT_MESSAGE
                    : SINGLE_FILE_DEFAULT_MESSAGE),
        }),
    ].filter(Boolean);
}

export function FileField(options: IFileField = {}) {
    return applyDecorators(
        ...getFileFieldDecorators(options),
    );
}
