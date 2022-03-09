import {getFieldDecorator, getFieldOptions, IBaseFieldOptions} from './BaseField';
import {DataMapper} from '../../../usecases/helpers/DataMapper';
import {IAllFieldOptions} from "./index";

export interface IExtendFieldOptions {
    sourceFieldName?: string
}

export function ExtendField(modelClass, options: string | IAllFieldOptions | any = {}) {
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
