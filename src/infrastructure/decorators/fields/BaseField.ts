import {applyDecorators} from '@nestjs/common';
import {ApiProperty} from '@nestjs/swagger';
import {ColumnType} from 'typeorm/driver/types/ColumnTypes';
import {DECORATORS} from '@nestjs/swagger/dist/constants';

export const MODEL_META_KEY = 'meta';
export const MODEL_FIELD_NAMES_KEY = 'meta_field_names';

export type AppColumnType = 'boolean' | 'createTime' | 'date' | 'dateTime' | 'decimal' | 'email' | 'enum' | 'file'
    | 'html' | 'integer' | 'password' | 'phone' | 'primaryKey' | 'string' | 'text' | 'time' | 'updateTime' | string;

export interface IBaseFieldOptions {
    decoratorName?: string,
    appType?: AppColumnType,
    dbType?: ColumnType,
    label?: string,
    hint?: string,
    example?: string,
    defaultValue?: any,
    nullable?: boolean,
    min?: number,
    max?: number,
    // Enum title to upload data on frontend
    items?: string,
}

const ColumnMetaDecorator = value => (object, propertyName) => {
    Reflect.defineMetadata(MODEL_META_KEY, value, object, propertyName);

    // Add field to list
    const fieldNames = Reflect.getMetadata(MODEL_FIELD_NAMES_KEY, object) || [];
    fieldNames.push(propertyName);
    Reflect.defineMetadata(MODEL_FIELD_NAMES_KEY, fieldNames, object);
};

export function BaseField(options: IBaseFieldOptions = null) {
    return applyDecorators(
        ColumnMetaDecorator({
            label: options.label || null,
            hint: options.hint || null,
            appType: options.appType || null,
            items: options.items || null,
            _raw: options,
        }),
        ApiProperty({
            description: options.label || undefined,
            example: options.example || undefined,
            required: options.nullable === false,
        }),
    );
}
