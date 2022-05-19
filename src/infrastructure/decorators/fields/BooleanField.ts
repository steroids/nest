import {applyDecorators} from '@nestjs/common';
import {has as _has} from 'lodash';
import {Column} from 'typeorm';
import {IsBoolean, IsOptional} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform} from "class-transformer";

const TRUE_VALUES = [true, 1, 'true', '1', 'y', 'yes', 'д', 'да'];

export const normalizeBoolean = (value) => {
    return TRUE_VALUES.includes(value);
}

export function BooleanField(options: IBaseFieldOptions = {}) {

    return applyDecorators(
        BaseField(options, {
            decoratorName: 'BooleanField',
            appType: 'boolean',
            jsType: 'boolean',
        }),
        Column({
            type: options.dbType || 'boolean',
            default: _has(options, 'defaultValue') ? options.defaultValue : false,
            nullable: _has(options, 'nullable') ? options.nullable : false,
        }),
        Transform(({value}) => {
            if (Array.isArray(value)) {
                return value.map(normalizeBoolean);
            }
            return normalizeBoolean(value);
        }),
        IsBoolean({
            message: 'Должен быть булевом',
        }),
        IsOptional(),
    );
}
