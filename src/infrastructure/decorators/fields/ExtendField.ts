import {getFieldDecorator, getFieldOptions} from './BaseField';
import {IAllFieldOptions} from "./index";
import {getFieldValidators, Validator} from '../../../usecases/validators/Validator';

export interface IExtendFieldOptions {
    sourceFieldName?: string,
}

export function ExtendField(ModelClass, options: (string | Partial<IAllFieldOptions>) = {}) {
    return (object, propertyName) => {
        if (typeof options === 'string') {
            options = {sourceFieldName: options};
        }

        const modelFieldName = options.sourceFieldName || propertyName;
        if (!modelFieldName) {
            throw new Error('Not found field "' + propertyName + '" in model "' + ModelClass.name + '"');
        }

        // Execute decorator
        const extendOptions = getFieldOptions(ModelClass, modelFieldName);
        const decorator = getFieldDecorator(ModelClass, modelFieldName);
        decorator({...extendOptions, ...options})(object, propertyName);

        // Extend validators
        getFieldValidators(ModelClass, modelFieldName).forEach(ValidatorClass => {
            Validator(ValidatorClass)(object, propertyName);
        });
    };
}
