export const STEROIDS_META_TRANSFORM = 'steroids_meta_transform';

export type ITransformCallback = (options: {value: any, item: any, key: string}) => any;

export const getTransformCallbacks = (object: any, propertyName: string): ITransformCallback[] => {
    return Reflect.getMetadata(STEROIDS_META_TRANSFORM, object, propertyName) || []
}

export const TransformDb = (callback: ITransformCallback) => (object, propertyName) => {
    const callbacks = getTransformCallbacks(object, propertyName) || [];
    callbacks.push(callback);
    Reflect.defineMetadata(STEROIDS_META_TRANSFORM, callbacks, object, propertyName);
};