import {ArrayMaxSize, ArrayMinSize, ArrayNotEmpty, IsArray, IsDefined, IsOptional, isString, NotEquals, ValidateIf} from 'class-validator';
import type {Type} from '@nestjs/common';
import type {ApiPropertyOptions} from '@nestjs/swagger';
import type {IAllFieldOptions} from '../index';
import type {IArrayFieldOptions, IBaseFieldOptions, IConstraintOption} from '../BaseField';

export const STEROIDS_META_FIELD_OPTIONS = 'steroids_meta_field_options';
export const STEROIDS_META_FIELD_INTERNAL_OPTIONS = 'steroids_meta_field_internal_options';
export const STEROIDS_META_KEYS = 'steroids_meta_keys';

export const ARRAY_IS_ARRAY_CONSTRAINT_MESSAGE = 'Значение должно быть массивом';
export const ARRAY_NOT_EMPTY_CONSTRAINT_MESSAGE = 'Массив не должен быть пустым';
export const getArrayMinLengthConstraintMessage = (value: number) => `Массив должен содержать не менее ${value} элементов`;
export const getArrayMaxLengthConstraintMessage = (value: number) => `Массив должен содержать не более ${value} элементов`;

export type AppColumnType = 'boolean' | 'createTime' | 'date' | 'dateTime' | 'decimal' | 'email' | 'enum' | 'file'
    | 'html' | 'integer' | 'password' | 'phone' | 'primaryKey' | 'relation' | 'relationId' | 'string' | 'text'
    | 'time' | 'updateTime' | string;

export interface IRelationData {
    relationName: string,
    relationClass: () => any,
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type ISwaggerFieldType = Type<unknown> | Function | [Function] | 'array' | 'string' | 'number' | 'boolean' | 'integer' | 'null';

export interface IFieldInternalOptions {
    appType?: AppColumnType,
    swaggerType?: ISwaggerFieldType,
    decoratorName?: string,
}

export type IFieldOptions = IBaseFieldOptions & Partial<IAllFieldOptions>;

export const getMetaFields = (MetaClass): string[] => {
    if (!MetaClass?.prototype) {
        throw new Error('Wrong meta class, prototype not found: ' + String(MetaClass));
    }
    return Reflect.getMetadata(STEROIDS_META_KEYS, MetaClass.prototype) || [];
};

export const getFieldOptions = (targetClass, fieldName: string): IFieldOptions => (
    targetClass
    && Reflect.getMetadata(STEROIDS_META_FIELD_OPTIONS, targetClass.prototype, fieldName)
);

export const getFieldInternalOptions = (targetClass, fieldName: string): IFieldInternalOptions | undefined => (
    targetClass
    && Reflect.getMetadata(STEROIDS_META_FIELD_INTERNAL_OPTIONS, targetClass.prototype, fieldName)
);

export const getFieldAppType = (targetClass, fieldName: string): AppColumnType | undefined => (
    getFieldInternalOptions(targetClass, fieldName)?.appType
);

export const getMetaPrimaryKey = (targetClass): string => getMetaFields(targetClass)
    .find(key => getFieldAppType(targetClass, key) === 'primaryKey') || null;

export const isMetaClass = (MetaClass): boolean => Reflect.hasMetadata(STEROIDS_META_KEYS, MetaClass.prototype);

export const getMetaRelations = (MetaClass, parentPrefix = null): string[] => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
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
    .filter(fieldName => ['relation'].includes(getFieldAppType(MetaClass, fieldName)))
    .filter((relationName) => {
        const relationOptions = getFieldOptions(MetaClass, relationName);
        return filterCallBack(relationOptions);
    });

export const getFieldDecoratorName = (targetClass, fieldName: string): string | undefined => (
    getFieldInternalOptions(targetClass, fieldName)?.decoratorName
);

export const getFieldDecorator = (targetClass, fieldName: string): (...args: any) => PropertyDecorator => {
    const decoratorName: string = getFieldDecoratorName(targetClass, fieldName);
    const decorator = require('../index')[decoratorName];
    if (!decorator) {
        throw new Error(`Not found Field decorator ${decoratorName}, property: ${fieldName}`);
    }

    return decorator;
};

export const getRequiredNullableValidators = ({required, nullable}: IBaseFieldOptions) => [
    // Отключаем валидацию для null, не пропускаем undefined
    required && nullable && [ValidateIf((object, value) => value !== null), NotEquals(undefined, {
        message: 'Обязательно для заполнения',
    })],
    // Не пропускаем null и undefined
    required && !nullable && IsDefined({
        message: 'Обязательно для заполнения',
    }),
    // Отключаем валидацию для null и undefined
    !required && nullable && IsOptional(),
    // Отключаем валидацию для undefined, не пропускаем null
    !required && !nullable && [ValidateIf((object, value) => value !== undefined), NotEquals(null, {
        message: 'Не может иметь null значение',
    })],
].flat().filter(Boolean);

export const getConstraintValue = <T>(option?: IConstraintOption<T>): T | undefined => (
    option && typeof option === 'object' && 'value' in option
        ? option.value
        : option as T | undefined
);

export const getConstraintMessage = <T>(option?: IConstraintOption<T>): string | undefined => (
    option && typeof option === 'object' && 'constraintMessage' in option
        ? option.constraintMessage
        : undefined
);

export const getArrayApiPropertyOptions = (options: Partial<IArrayFieldOptions>): ApiPropertyOptions => {
    if (!options.isArray) {
        return {
            isArray: options.isArray,
        };
    }

    const minLength = getConstraintValue(options.arrayOptions?.minLength);
    const maxLength = getConstraintValue(options.arrayOptions?.maxLength);
    const notEmpty = options.arrayOptions?.notEmpty;
    const minItems = notEmpty
        ? Math.max(1, minLength ?? 0)
        : minLength;

    return {
        isArray: true,
        minItems,
        maxItems: maxLength,
    };
};

export const getArrayValidators = (
    options: IArrayFieldOptions,
) => {
    if (!options.isArray) {
        return [];
    }

    const minLength = getConstraintValue(options.arrayOptions?.minLength);
    const maxLength = getConstraintValue(options.arrayOptions?.maxLength);
    const notEmpty = options.arrayOptions?.notEmpty;

    return [
        IsArray({
            message: options.isArrayConstraintMessage || ARRAY_IS_ARRAY_CONSTRAINT_MESSAGE,
        }),
        notEmpty && ArrayNotEmpty({
            message: options.arrayOptions?.notEmptyConstraintMessage || ARRAY_NOT_EMPTY_CONSTRAINT_MESSAGE,
        }),
        typeof minLength === 'number' && ArrayMinSize(minLength, {
            message: getConstraintMessage(options.arrayOptions?.minLength)
                || getArrayMinLengthConstraintMessage(minLength),
        }),
        typeof maxLength === 'number' && ArrayMaxSize(maxLength, {
            message: getConstraintMessage(options.arrayOptions?.maxLength)
                || getArrayMaxLengthConstraintMessage(maxLength),
        }),
    ].filter(Boolean);
};
