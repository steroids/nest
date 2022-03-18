import {applyDecorators} from '@nestjs/common';
import {has as _has} from 'lodash';
import {Column} from 'typeorm';
import {IsBoolean, IsOptional} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {Transform} from "class-transformer";

export function BooleanField(options: IBaseFieldOptions = {}) {
    const parseBoolean = (value) => {
        if (value === 'false' || !value) {
            return false;
        }
        return true;
    }

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
                return value.map(parseBoolean);
            }
            return value === null ? value : parseBoolean(value);
        }),
        IsBoolean({
            message: 'Должен быть булевом',
        }),
        IsOptional(),
    );
}
