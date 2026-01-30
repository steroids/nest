import {applyDecorators} from '@nestjs/common';
import {IsEnum, ValidateIf} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {BaseField, IBaseFieldOptions} from './BaseField';
import BaseEnum from '../../../domain/base/BaseEnum';

export interface IEnumFieldOptions extends IBaseFieldOptions {
    enum?: object | string[] | any,
    enumName?: string;
    isEnumConstraintMessage?: string,
}

type BaseEnumClass<T extends BaseEnum = BaseEnum> = {
    new (): T;
} & typeof BaseEnum;

function getOpenApiEnum(enumEntity: string[] | object | BaseEnumClass): string[] {
    if (Array.isArray(enumEntity)) {
        return enumEntity;
    }

    if (typeof enumEntity === 'function' && enumEntity.prototype instanceof BaseEnum) {
        return (enumEntity as BaseEnumClass).getKeys();
    }

    return Object.values(enumEntity);
}

function getValidatorEnum(enumEntity: string[] | object | any): Record<string, string> {
    if (Array.isArray(enumEntity)) {
        return enumEntity.reduce((obj, value) => {
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
    }

    if (typeof enumEntity === 'function' && enumEntity.prototype instanceof BaseEnum) {
        return enumEntity.toEnum();
    }

    return enumEntity;
}

export function EnumField(options: IEnumFieldOptions = {}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'EnumField',
            appType: 'enum',
            jsType: 'string',
        }),
        ApiProperty({
            enum: getOpenApiEnum(options.enum),
            enumName: options.enumName,
            isArray: options.isArray,
        }),
        options.nullable && ValidateIf((object, value) => value !== null && typeof value !== 'undefined'),
        IsEnum(
            getValidatorEnum(options.enum),
            {
                each: options.isArray,
                message: options.isEnumConstraintMessage || 'Выберите одно из значений',
            },
        ),
    ].filter(Boolean));
}
