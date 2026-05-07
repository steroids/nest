import {applyDecorators} from '@nestjs/common';
import {IsMilitaryTime, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export const IS_MILITARY_TIME_DEFAULT_MESSAGE = 'Время необходимо ввести в формате часы:минуты, например 07:32';

export interface ITimeFieldOptions extends IBaseFieldOptions {
    isMilitaryTimeConstraintMessage?: string,
}

export function TimeField(options: ITimeFieldOptions = {}) {
    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'TimeField',
                appType: 'time',
                jsType: 'string',
            }),
            options?.nullable && ValidateIf((object, value) => value !== null),
            IsMilitaryTime({
                message: options.isMilitaryTimeConstraintMessage || IS_MILITARY_TIME_DEFAULT_MESSAGE,
            }),
        ].filter(Boolean),
    );
}
