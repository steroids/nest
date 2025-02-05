import {applyDecorators} from '@nestjs/common';
import {IBaseFieldOptions} from './BaseField';
import {getFileFieldDecorators} from './FileField';

export interface IFileField extends IBaseFieldOptions {
    multiple?: boolean,
    isImage?: boolean,
}

export function ImageField(options: IFileField = {}) {
    return applyDecorators(
        ...getFileFieldDecorators({
            ...options,
            isImage: true,
        }),
    );
}
