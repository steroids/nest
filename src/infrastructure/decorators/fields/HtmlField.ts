import {applyDecorators} from '@nestjs/common';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function HtmlField(options: IBaseFieldOptions = {}) {
    return applyDecorators(
        BaseField(options, {
            decoratorName: 'HtmlField',
            appType: 'html',
            jsType: 'string',
        }),
    );
}
