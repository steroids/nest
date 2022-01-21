import {IBaseFieldOptions, MODEL_META_KEY} from './BaseField';

export interface IExtendFieldOptions extends IBaseFieldOptions {
    propertyName?: string,
}

export function ExtendField(modelClass, options: IExtendFieldOptions = {}) {
    return (object, propertyName) => {
        if (options.propertyName) {
            propertyName = options.propertyName;
        }

        const modelMeta: any = Reflect.getMetadata(MODEL_META_KEY, modelClass.prototype, propertyName);
        const extendOptions:IBaseFieldOptions = {
            ...modelMeta._raw,
            ...options,
        };

        const decorator = require('./index')[extendOptions.decoratorName];
        if (!decorator) {
            throw new Error(`Not found Field decorator ${extendOptions.decoratorName}, property: ${propertyName}`);
        }

        decorator(extendOptions)(object, propertyName);
    };
}
