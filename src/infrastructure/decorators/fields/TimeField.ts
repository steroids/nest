import {applyDecorators} from '@nestjs/common';
import {IsMilitaryTime, ValidateIf} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

const isHhMmTime = 'Время необходимо ввести в формате часы:минуты, например 07:32';

export interface ITimeFieldOptions extends IBaseFieldOptions {
    isHhMmTimeConstraintMessage?: string,
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
                message: options.isHhMmTimeConstraintMessage || isHhMmTime,
            }),
        ].filter(Boolean),
    );
}
