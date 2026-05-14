import {applyDecorators} from '@nestjs/common';
import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty} from 'class-validator';
import {ITransformCallback, Transform} from '../Transform';
import {
    STEROIDS_META_FIELD_INTERNAL_OPTIONS,
    STEROIDS_META_FIELD_OPTIONS,
    STEROIDS_META_KEYS,
} from './helpers/InternalFieldMetadataHelpers';
import type {IFieldInternalOptions, IFieldOptions} from './helpers/InternalFieldMetadataHelpers';

export interface IBaseFieldOptions {
    /**
     * Field name, displayed in swagger documentation
     */
    label?: string,
    /**
     * Example of a field value, displayed in the swagger documentation.
     */
    example?: string,
    /**
     * Default value of the field.
     * Passes to TypeORM to set the default value in the database.
     */
    defaultValue?: any,
    /**
     * Flag indicating whether the field is required.
     */
    required?: boolean,
    /**
     * Flag indicating whether the field value can be null.
     */
    nullable?: boolean,
    /**
     * Flag indicating whether the field is an array
     */
    isArray?: boolean,
    /**
     * Minimum value
     */
    min?: number,
    /**
     * Maximum value
     */
    max?: number,
    /**
     * Enum titles to upload data on frontend
     */
    items?: string,
    /**
     * Callback that transforms the field value when an object is created using DataMapper
     */
    transform?: ITransformCallback,
    /**
     * If this flag is set, the field will not be present in the database
     */
    noColumn?: boolean,
}

const ColumnMetaDecorator = (options: IFieldOptions, internalOptions: IFieldInternalOptions) => (object, propertyName) => {
    //проверить getOwnMetadata
    Reflect.defineMetadata(STEROIDS_META_FIELD_OPTIONS, options, object, propertyName);
    Reflect.defineMetadata(STEROIDS_META_FIELD_INTERNAL_OPTIONS, internalOptions, object, propertyName);

    // Add field to list
    const fieldNames = (Reflect.getMetadata(STEROIDS_META_KEYS, object) || []).concat(propertyName);
    Reflect.defineMetadata(STEROIDS_META_KEYS, fieldNames, object);
};

/**
 * Base decorator used by concrete Field decorators.
 *
 * @param options Public field options passed by the user or prepared by a concrete Field decorator.
 * They describe user-facing field behavior and are stored in `STEROIDS_META_FIELD_OPTIONS`.
 * Examples: `label`, `example`, `required`, `nullable`, `isArray`, `transform`, `noColumn`.
 *
 * @param internalOptions Internal service options set by concrete Field decorators.
 * They are not part of the public Field API and are stored separately in
 * `STEROIDS_META_FIELD_INTERNAL_OPTIONS`.
 * Examples: `appType`, `decoratorName`, `swaggerType`.
 */
export function BaseField(options: IBaseFieldOptions = {}, internalOptions: IFieldInternalOptions = {}) {
    return applyDecorators(
        ...[
            ColumnMetaDecorator(options, internalOptions),
            ApiProperty({
                type: internalOptions.swaggerType,
                description: options.label || undefined,
                example: options.example || undefined,
                required: options.nullable === false,
                isArray: options.isArray,
            }),
            options.transform && Transform(options.transform),
            options.required && IsNotEmpty({
                message: 'Обязательно для заполнения',
            }),
        ].filter(Boolean),
    );
}

export {
    AppColumnType,
    IFieldInternalOptions,
    IFieldOptions,
    IRelationData,
    STEROIDS_META_FIELD_INTERNAL_OPTIONS,
    STEROIDS_META_FIELD_OPTIONS,
    STEROIDS_META_KEYS,
    getFieldAppType,
    getFieldDecorator,
    getFieldDecoratorName,
    getFieldInternalOptions,
    getFieldOptions,
    getMetaFields,
    getMetaPrimaryKey,
    getMetaRelations,
    getRelationsByFilter,
    isMetaClass,
} from './helpers/InternalFieldMetadataHelpers';
