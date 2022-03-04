export const STEROIDS_META_TRANSFORM_DB = 'steroids_meta_transform_db';

export interface ITransformDbCallback {
    from?: (options: {value: any, item: any, key: string}) => any,
    to?: (options: {value: any, item: any, key: string}) => any,
}

export const getTransformDbCallbacks = (object: any, propertyName: string): ITransformDbCallback[] => {
    return Reflect.getMetadata(STEROIDS_META_TRANSFORM_DB, object, propertyName) || []
}

export const TransformDb = (callback: ITransformDbCallback) => (object, propertyName) => {
    const callbacks = getTransformDbCallbacks(object, propertyName) || [];
    callbacks.push(callback);
    Reflect.defineMetadata(STEROIDS_META_TRANSFORM_DB, callbacks, object, propertyName);
};