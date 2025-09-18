import {applyDecorators} from '@nestjs/common';
import {IsMilitaryTime} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function TimeField(options: IBaseFieldOptions = {}) {
    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'TimeField',
                appType: 'time',
                jsType: 'string',
            }),
            IsMilitaryTime({
                message: 'Время необходимо ввести в формате часы:минуты, например 07:32',
            }),
        ].filter(Boolean),
    );
}
