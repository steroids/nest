import {getFieldDecorator, getFieldOptions} from './BaseField';
import {IAllFieldOptions} from "./index";

export interface IExtendFieldOptions {
    sourceFieldName?: string
}

export function ExtendField(modelClass, options: (string | Partial<IAllFieldOptions>) = {}) {
    return (object, propertyName) => {
        if (typeof options === 'string') {
            options = {sourceFieldName: options};
        }

        const modelFieldName = options.sourceFieldName || propertyName;
        if (!modelFieldName) {
            throw new Error('Not found field "' + propertyName + '" in model "' + modelClass.name + '"');
        }

        // Execute decorator
        const extendOptions = getFieldOptions(modelClass, modelFieldName);
        const decorator = getFieldDecorator(modelClass, modelFieldName);
        decorator({...extendOptions, ...options})(object, propertyName);
    };
}
