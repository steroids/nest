import {applyDecorators} from '@nestjs/common';
import {getFileFieldDecorators, IFileField} from './FileField';

export function ImageField(options: IFileField = {}) {
    return applyDecorators(
        ...getFileFieldDecorators({
            ...options,
            isImage: true,
        }),
    );
}
