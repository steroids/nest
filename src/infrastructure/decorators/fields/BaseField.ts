import {applyDecorators} from '@nestjs/common';
import {ApiProperty} from '@nestjs/swagger';
import {ColumnType} from '@steroidsjs/typeorm/driver/types/ColumnTypes';
import {IsNotEmpty, isString} from 'class-validator';
import {IAllFieldOptions} from './index';
import {ITransformCallback, Transform} from '../Transform';

export const STEROIDS_META_FIELD = 'steroids_meta_field';
export const STEROIDS_META_FIELD_DECORATOR = 'steroids_meta_field_decorator';
export const STEROIDS_META_KEYS = 'steroids_meta_keys';

export type AppColumnType = 'boolean' | 'createTime' | 'date' | 'dateTime' | 'decimal' | 'email' | 'enum' | 'file'
    | 'html' | 'integer' | 'password' | 'phone' | 'primaryKey' | 'relation' | 'relationId' | 'string' | 'text'
    | 'time' | 'updateTime' | string;
export type JsType = 'boolean' | 'string' | 'number' | string;

export interface IBaseFieldOptions {
    /**
     * App type
     */
    appType?: AppColumnType,
    /**
     * JavaScript type
     */
    jsType?: ColumnType,
    /**
     * Database type
     */
    dbType?: ColumnType,
    /**
     * Field name, displayed in swagger documentation
     */
    label?: string,
    /**
     * Hint
     */
    hint?: string,
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
     * Plain name
     */
    plainName?: string,
    /**
     * Callback that transforms the field value when an object is created using DataMapper
     */
    transform?: ITransformCallback,
    /**
     * If this flag is set, the field will not be present in the database
     */
    noColumn?: boolean,
}

export interface IRelationData {
    relationName: string,
    relationClass: () => any,
}

export interface IInternalFieldOptions {
    appType?: AppColumnType,
    jsType?: ColumnType,
    swaggerType?: ColumnType,
    decoratorName?: string,
    isArray?: boolean,
}

export const getMetaFields = (MetaClass): string[] => {
    if (!MetaClass?.prototype) {
        throw new Error('Wrong meta class, prototype not found: ' + String(MetaClass));
    }
    return Reflect.getMetadata(STEROIDS_META_KEYS, MetaClass.prototype) || [];
};

export const getFieldOptions = (targetClass, fieldName: string): IAllFieldOptions => targetClass && Reflect.getMetadata(STEROIDS_META_FIELD, targetClass.prototype, fieldName);

export const getMetaPrimaryKey = (targetClass): string => getMetaFields(targetClass)
    .find(key => getFieldOptions(targetClass, key).appType === 'primaryKey') || null;

export const isMetaClass = (MetaClass): boolean => Reflect.hasMetadata(STEROIDS_META_KEYS, MetaClass.prototype);


export const getMetaRelations = (MetaClass, parentPrefix = null): string[] => {
    const findRelationsRecursive = (MetaClass, foundClasses, parentPrefix = null) => getMetaFields(MetaClass)
        .filter(fieldName => {
            const options = getFieldOptions(MetaClass, fieldName);

            if (options?.appType === 'computable' && options?.requiredRelations) {
                return true;
            }

            return ['relationId', 'relation'].includes(options?.appType);
        })
        .reduce((allRelationsData, relationName) => {
            const options = getFieldOptions(MetaClass, relationName);

            if (options?.appType === 'relationId') {
                allRelationsData.push(relationName);
                return allRelationsData;
            }

            if (options?.appType === 'computable' && options?.requiredRelations) {
                allRelationsData.push(...options.requiredRelations);
            }

            if (options?.appType !== 'computable') {
                allRelationsData.push({
                    relationName,
                    relationClass: options.relationClass,
                });
            }

            return allRelationsData;
        }, [])
        .reduce((allRelations, relationData: IRelationData | string) => {
            if (isString(relationData)) {
                allRelations.push(relationData);
                return allRelations;
            }

            if (!allRelations.includes(relationData.relationName)) {
                allRelations.push(relationData.relationName);
            }

            if (!relationData.relationClass) {
                return allRelations;
            }

            const relationValue = relationData.relationClass();
            // Из-за этого кода возвращаются не все реляции в случаях, когда у одного MetaClass'а
            // есть несколько реляций с одним и тем же классом (см. ImageDownloadSchema для примера)
            // @todo нужно исправить этот баг, иначе реализовав кэширование уже обработанных классов
            const key = [relationData.relationName, relationValue.name].join('.');

            if (foundClasses.includes(key)) {
                return allRelations;
            }
            foundClasses.push(key);

            if (isMetaClass(relationValue)) {
                const subRelationNames = findRelationsRecursive(relationValue, foundClasses, relationData.relationName)
                    .map(subRelationName => `${relationData.relationName}.${subRelationName}`);
                allRelations = [...allRelations, ...subRelationNames];
            }

            return allRelations;
        }, []);
    return findRelationsRecursive(MetaClass, []);
};

export const getRelationsByFilter = (
    MetaClass,
    filterCallBack: (options: IAllFieldOptions) => void,
): string[] => getMetaFields(MetaClass)
    .filter(fieldName => {
        const options = getFieldOptions(MetaClass, fieldName);
        return ['relation'].includes(options.appType);
    })
    .filter((relationName) => {
        const relationOptions = getFieldOptions(MetaClass, relationName);
        return filterCallBack(relationOptions);
    });

export const getFieldDecoratorName = (targetClass, fieldName: string): string | undefined => Reflect.getMetadata(STEROIDS_META_FIELD_DECORATOR, targetClass.prototype, fieldName);

export const getFieldDecorator = (targetClass, fieldName: string): (...args: any) => PropertyDecorator => {
    const decoratorName: string = getFieldDecoratorName(targetClass, fieldName);
    const decorator = require('./index')[decoratorName];
    if (!decorator) {
        throw new Error(`Not found Field decorator ${decoratorName}, property: ${fieldName}`);
    }

    return decorator;
};

const ColumnMetaDecorator = (options: IBaseFieldOptions, internalOptions: IInternalFieldOptions) => (object, propertyName) => {
    //проверить getOwnMetadata
    Reflect.defineMetadata(STEROIDS_META_FIELD, options, object, propertyName);
    Reflect.defineMetadata(STEROIDS_META_FIELD_DECORATOR, internalOptions.decoratorName, object, propertyName);

    // Add field to list
    const fieldNames = (Reflect.getMetadata(STEROIDS_META_KEYS, object) || []).concat(propertyName);
    Reflect.defineMetadata(STEROIDS_META_KEYS, fieldNames, object);
};

export function BaseField(options: IBaseFieldOptions = null, internalOptions: IInternalFieldOptions = {}) {
    return applyDecorators(
        ...[
            ColumnMetaDecorator({
                label: null,
                hint: null,
                ...options,
                isArray: typeof options.isArray === 'boolean'
                    ? options.isArray
                    : (internalOptions.isArray || null),
                appType: internalOptions.appType || null,
            }, internalOptions),
            ApiProperty({
                type: options.jsType || internalOptions.swaggerType || internalOptions.jsType,
                description: options.label || undefined,
                example: options.example || undefined,
                required: options.nullable === false,
                isArray: options.isArray || internalOptions.isArray,
            }),
            options.transform && Transform(options.transform),
            options.required && IsNotEmpty({
                message: 'Обязательно для заполнения',
            }),
        ].filter(Boolean),
    );
}
