import {applyDecorators} from '@nestjs/common';
import {IsEnum} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {BaseField, IBaseFieldOptions} from './BaseField';
import BaseEnum from '../../../domain/base/BaseEnum';

export interface IEnumFieldOptions extends IBaseFieldOptions {
    enum?: object | string[] | any,
    isEnumConstraintMessage?: string,
}

export function EnumField(options: IEnumFieldOptions = {}) {
    if (Array.isArray(options.enum)) {
        options.enum = options.enum.reduce((obj, value) => {
            if (value.prototype instanceof BaseEnum) {
                obj = {
                    ...obj,
                    ...value.toEnum(),
                };
            } else if (typeof value === 'string') {
                obj[value] = value;
            }
            return obj;
        }, {});
    } else if (typeof options.enum === 'function' && options.enum.prototype instanceof BaseEnum) {
        options.enum = options.enum.toEnum();
    }

    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'EnumField',
            appType: 'enum',
            jsType: 'string',
        }),
        ApiProperty({
            enum: options.enum,
        }),
        IsEnum(options.enum, {
            each: options.isArray,
            message: options.isEnumConstraintMessage || 'Выберите одно из значений',
        }),
    ].filter(Boolean));
}
