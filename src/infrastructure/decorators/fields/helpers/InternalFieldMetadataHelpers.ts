import {isString} from 'class-validator';
import type {ApiPropertyOptions} from '@nestjs/swagger';
import type {IAllFieldOptions} from '../index';
import type {IBaseFieldOptions} from '../BaseField';

export const STEROIDS_META_FIELD_OPTIONS = 'steroids_meta_field_options';
export const STEROIDS_META_FIELD_INTERNAL_OPTIONS = 'steroids_meta_field_internal_options';
export const STEROIDS_META_KEYS = 'steroids_meta_keys';

export type AppColumnType = 'boolean' | 'createTime' | 'date' | 'dateTime' | 'decimal' | 'email' | 'enum' | 'file'
    | 'html' | 'integer' | 'password' | 'phone' | 'primaryKey' | 'relation' | 'relationId' | 'string' | 'text'
    | 'time' | 'updateTime' | string;

export interface IRelationData {
    relationName: string,
    relationClass: () => any,
}

export interface IFieldInternalOptions {
    appType?: AppColumnType,
    swaggerType?: ApiPropertyOptions['type'],
    decoratorName?: string,
}

export type IFieldOptions = IBaseFieldOptions & Partial<IAllFieldOptions>;

export const getMetaFields = (MetaClass): string[] => {
    if (!MetaClass?.prototype) {
        throw new Error('Wrong meta class, prototype not found: ' + String(MetaClass));
    }
    return Reflect.getMetadata(STEROIDS_META_KEYS, MetaClass.prototype) || [];
};

export const getFieldOptions = (targetClass, fieldName: string): IFieldOptions => targetClass && Reflect.getMetadata(STEROIDS_META_FIELD_OPTIONS, targetClass.prototype, fieldName);

export const getFieldInternalOptions = (targetClass, fieldName: string): IFieldInternalOptions | undefined => targetClass && Reflect.getMetadata(STEROIDS_META_FIELD_INTERNAL_OPTIONS, targetClass.prototype, fieldName);

export const getFieldAppType = (targetClass, fieldName: string): AppColumnType | undefined => getFieldInternalOptions(targetClass, fieldName)?.appType;

export const getMetaPrimaryKey = (targetClass): string => getMetaFields(targetClass)
    .find(key => getFieldAppType(targetClass, key) === 'primaryKey') || null;

export const isMetaClass = (MetaClass): boolean => Reflect.hasMetadata(STEROIDS_META_KEYS, MetaClass.prototype);

export const getMetaRelations = (MetaClass, parentPrefix = null): string[] => {
    const findRelationsRecursive = (MetaClass, foundClasses, parentPrefix = null) => getMetaFields(MetaClass)
        .filter(fieldName => {
            const options = getFieldOptions(MetaClass, fieldName);

            const appType = getFieldAppType(MetaClass, fieldName);

            if (appType === 'computable' && options?.requiredRelations) {
                return true;
            }

            return ['relationId', 'relation'].includes(appType);
        })
        .reduce((allRelationsData, relationName) => {
            const options = getFieldOptions(MetaClass, relationName);
            const appType = getFieldAppType(MetaClass, relationName);

            if (appType === 'relationId') {
                allRelationsData.push(relationName);
                return allRelationsData;
            }

            if (appType === 'computable' && options?.requiredRelations) {
                allRelationsData.push(...options.requiredRelations);
            }

            if (appType !== 'computable') {
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
    filterCallBack: (options: IFieldOptions) => void,
): string[] => getMetaFields(MetaClass)
    .filter(fieldName => {
        return ['relation'].includes(getFieldAppType(MetaClass, fieldName));
    })
    .filter((relationName) => {
        const relationOptions = getFieldOptions(MetaClass, relationName);
        return filterCallBack(relationOptions);
    });

export const getFieldDecoratorName = (targetClass, fieldName: string): string | undefined => getFieldInternalOptions(targetClass, fieldName)?.decoratorName;

export const getFieldDecorator = (targetClass, fieldName: string): (...args: any) => PropertyDecorator => {
    const decoratorName: string = getFieldDecoratorName(targetClass, fieldName);
    const decorator = require('../index')[decoratorName];
    if (!decorator) {
        throw new Error(`Not found Field decorator ${decoratorName}, property: ${fieldName}`);
    }

    return decorator;
};
