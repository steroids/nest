import {applyDecorators} from '@nestjs/common';
import {ApiProperty} from '@nestjs/swagger';
import {ColumnType} from 'typeorm/driver/types/ColumnTypes';
import {IsNotEmpty} from 'class-validator';

export const MODEL_META_KEY = 'meta';
export const MODEL_FIELD_DECORATOR_NAME = 'meta_field_decorator_name';
export const MODEL_FIELD_NAMES_KEY = 'meta_field_names';

export type AppColumnType = 'boolean' | 'createTime' | 'date' | 'dateTime' | 'decimal' | 'email' | 'enum' | 'file'
    | 'html' | 'integer' | 'password' | 'phone' | 'primaryKey' | 'relation' | 'string' | 'text' | 'time' | 'updateTime' | string;
export type JsType = 'boolean' | 'string' | 'number' | string;

export interface IBaseFieldOptions {
    appType?: AppColumnType,
    jsType?: ColumnType,
    dbType?: ColumnType,
    label?: string,
    hint?: string,
    example?: string,
    defaultValue?: any,
    required?: boolean,
    nullable?: boolean,
    isArray?: boolean,
    min?: number,
    max?: number,
    // Enum title to upload data on frontend
    items?: string,
}

export interface IInternalFieldOptions {
    appType?: AppColumnType,
    jsType?: ColumnType,
    decoratorName?: string,
    isArray?: boolean,
}

const ColumnMetaDecorator = (options: IBaseFieldOptions, internalOptions: IInternalFieldOptions) => (object, propertyName) => {
    Reflect.defineMetadata(MODEL_META_KEY, options, object, propertyName);
    Reflect.defineMetadata(MODEL_FIELD_DECORATOR_NAME, internalOptions.decoratorName, object, propertyName);

    // Add field to list
    const fieldNames = Reflect.getMetadata(MODEL_FIELD_NAMES_KEY, object) || [];
    fieldNames.push(propertyName);
    Reflect.defineMetadata(MODEL_FIELD_NAMES_KEY, fieldNames, object);
};

export function BaseField(options: IBaseFieldOptions = null, internalOptions: IInternalFieldOptions) {
    return applyDecorators(
        ...[
            ColumnMetaDecorator({
                label: null,
                hint: null,
                items: null, // TODO
                ...options,
                isArray: internalOptions.isArray || null,
                appType: internalOptions.appType || null,
            }, internalOptions),
            ApiProperty({
                type: options.jsType,
                description: options.label || undefined,
                example: options.example || undefined,
                required: options.nullable === false,
                isArray: options.isArray,
            }),
            options.required && IsNotEmpty(),
        ].filter(Boolean)
    );
}
