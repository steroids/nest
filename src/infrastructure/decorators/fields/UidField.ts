import {applyDecorators} from '@nestjs/common';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function UidField(options: IBaseFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Уникальный код';
    }

    return applyDecorators(
        BaseField(options, {
            decoratorName: 'UidField',
            appType: 'uid',
            jsType: 'string',
        }),
    );
}
