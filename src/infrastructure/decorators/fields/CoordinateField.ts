import {applyDecorators} from '@nestjs/common';
import {IsString} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface ICoordinateFieldOptions extends IBaseFieldOptions {
    precision?: number,
    scale?: number,
}

export function CoordinateField(options: ICoordinateFieldOptions = {}) {
    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'CoordinateField',
                appType: 'decimal',
                jsType: 'number',
            }),
            IsString(),
        ].filter(Boolean)
    );
}
