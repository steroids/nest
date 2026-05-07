import {applyDecorators} from '@nestjs/common';
import {IsBoolean, IsOptional} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform} from '../Transform';

export const IS_BOOLEAN_DEFAULT_MESSAGE = 'Должен быть булевом';

export interface IBooleanFieldOptions extends IBaseFieldOptions {
    isBooleanConstraintMessage?: string,
}

const TRUE_VALUES = [true, 1, 'true', '1', 'y', 'yes', 'д', 'да'];

export const normalizeBoolean = (value) => TRUE_VALUES.includes(value);

export function BooleanField(options: IBooleanFieldOptions = {}) {
    return applyDecorators(
        BaseField(options, {
            decoratorName: 'BooleanField',
            appType: 'boolean',
            jsType: 'boolean',
        }),
        Transform(({value}) => {
            if (Array.isArray(value)) {
                return value.map(normalizeBoolean);
            }
            return normalizeBoolean(value);
        }),
        IsBoolean({
            message: options.isBooleanConstraintMessage || IS_BOOLEAN_DEFAULT_MESSAGE,
        }),
        IsOptional(),
    );
}
