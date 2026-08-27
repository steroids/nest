import {applyDecorators} from '@nestjs/common';
import {IArrayFieldOptions, IBaseFieldOptions} from './BaseField';
import {getFileFieldDecorators} from './FileField';

export interface IFileField extends IBaseFieldOptions, IArrayFieldOptions {
    isImage?: boolean,
    isFileConstraintMessage?: string,
}

export function ImageField(options: IFileField = {}) {
    return applyDecorators(
        ...getFileFieldDecorators({
            ...options,
            isImage: true,
        }),
    );
}
