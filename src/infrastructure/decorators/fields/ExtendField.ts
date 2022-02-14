import {getFieldDecorator, getFieldOptions, IBaseFieldOptions} from './BaseField';
import {DataMapperHelper} from '../../../usecases/helpers/DataMapperHelper';

export interface IExtendFieldOptions extends IBaseFieldOptions {
    sourceFieldName?: string,
}

export function ExtendField(modelClass, options: string | IExtendFieldOptions = {}) {
    return (object, propertyName) => {
        if (typeof options === 'string') {
            options = {sourceFieldName: options};
        }

        // Detect model field name with *Id and *Ids suffixes
        let modelFieldName;
        if (options.sourceFieldName) {
            modelFieldName = options.sourceFieldName;
        } else {
            const modelFieldNames = DataMapperHelper.getKeys(modelClass);
            for (let suffix of ['', 'Id', 'Ids']) {
                const nameWithoutSuffix = propertyName.replace(new RegExp(suffix + '$', 'g'), '');
                if (modelFieldNames.includes(nameWithoutSuffix)) {
                    modelFieldName = nameWithoutSuffix;
                    break;
                }
            }
        }
        if (!modelFieldName) {
            throw new Error('Not found field "' + propertyName + '" in model "' + modelClass.name + '"');
        }

        // Execute decorator
        const extendOptions = getFieldOptions(modelClass, modelFieldName);
        const decorator = getFieldDecorator(modelClass, modelFieldName);
        decorator({...extendOptions, ...options})(object, propertyName);
    };
}
