import {IAllFieldOptions} from './fields';

export const STEROIDS_META_TRANSFORM_PREFIX = 'steroids_meta_transform_';

export interface ITransformCallbackEvent {
    value: any,
    item: any,
    key: string,
    options: IAllFieldOptions,
    transformType: ITransformType,
    object: any,
}

export type ITransformCallback = (event: ITransformCallbackEvent) => any;

export type ITransformType = 'default' | 'computable' | 'from_db' | 'to_db' | string;
export const TRANSFORM_TYPE_DEFAULT = 'default';
export const TRANSFORM_TYPE_COMPUTABLE = 'computable';
export const TRANSFORM_TYPE_FROM_DB = 'from_db';
export const TRANSFORM_TYPE_TO_DB = 'to_db';

export const getTransformCallbacks = (
    object: any,
    propertyName: string,
    transformType: ITransformType
): ITransformCallback[] => {
    return Reflect.getMetadata(STEROIDS_META_TRANSFORM_PREFIX + transformType, object, propertyName) || []
}

export const Transform = (
    callback: ITransformCallback,
    transformType: ITransformType = TRANSFORM_TYPE_DEFAULT
) => (object, propertyName) => {
    const callbacks = getTransformCallbacks(object, propertyName, transformType) || [];
    callbacks.push(callback);
    Reflect.defineMetadata(STEROIDS_META_TRANSFORM_PREFIX + transformType, callbacks, object, propertyName);
};
