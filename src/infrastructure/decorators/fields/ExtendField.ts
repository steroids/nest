import {ApiProperty} from '@nestjs/swagger';
import {getFieldDecorator, getFieldOptions} from './BaseField';
import {IAllFieldOptions} from './index';
import {getValidators, Validator} from '../../../usecases/validators/Validator';

export interface IExtendFieldOptions {
    sourceFieldName?: string,
    extendValidators?: boolean,
}

export function ExtendField(
    ModelClass,
    options: (string | Partial<IAllFieldOptions>) = {
        extendValidators: true,
    },
) {
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
        const decoratorOptions = {
            ...extendOptions,
            ...options,
        };

        decorator(decoratorOptions)(object, propertyName);

        if (options.extendValidators) {
            // Extend validators
            getValidators(ModelClass, modelFieldName).forEach(ValidatorClass => {
                Validator(ValidatorClass)(object, propertyName);
            });
        }

        if (propertyName !== modelFieldName) {
            ApiProperty({
                name: modelFieldName,
            })(object, propertyName);
        }
    };
}
