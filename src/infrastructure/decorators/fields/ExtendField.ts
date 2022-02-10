import {IBaseFieldOptions, MODEL_FIELD_DECORATOR_NAME, MODEL_META_KEY} from './BaseField';
import {DataMapperHelper} from '../../../usecases/helpers/DataMapperHelper';

export interface IExtendFieldOptions extends IBaseFieldOptions {
    propertyName?: string,
}

export function ExtendField(modelClass, options: IExtendFieldOptions = {}) {
    return (object, propertyName) => {
        if (options.propertyName) {
            propertyName = options.propertyName;
        }

        // Detect model field name with *Id and *Ids suffixes
        let modelFieldName;
        const modelFieldNames = DataMapperHelper.getKeys(modelClass);


        for (let suffix of ['', 'Id', 'Ids']) {
            const nameWithoutSuffix = propertyName.replace(new RegExp(suffix + '$', 'g'), '');
            if (modelFieldNames.includes(nameWithoutSuffix)) {
                modelFieldName = nameWithoutSuffix;
                break;
            }
        }

        if (!modelFieldName) {
            throw new Error('Not found field "' + propertyName + '" in model "' + modelClass.name + '"');
        }

        const extendOptions: IBaseFieldOptions = Reflect.getMetadata(MODEL_META_KEY, modelClass.prototype, modelFieldName);
        const decoratorName: string = Reflect.getMetadata(MODEL_FIELD_DECORATOR_NAME, modelClass.prototype, modelFieldName);

        const decorator = require('./index')[decoratorName];
        if (!decorator) {
            throw new Error(`Not found Field decorator ${decoratorName}, property: ${propertyName}`);
        }

        decorator({
            ...extendOptions,
            ...options,
        })(object, propertyName);
    };
}
