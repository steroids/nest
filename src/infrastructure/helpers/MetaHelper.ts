import {Connection} from 'typeorm';
import {DECORATORS} from '@nestjs/swagger/dist/constants';
import {MODEL_META_KEY} from '../decorators/fields/BaseField';
import {DataMapperHelper} from '../../usecases/helpers/DataMapperHelper';

export class MetaHelper {
    static exportModels(types: any[]) {
        const result = {};
        types.forEach(type => {
            const fieldNames = DataMapperHelper.getKeys(type);
            result[type.name] = {
                attributes: fieldNames.map(fieldName => {
                    const apiMeta = Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, type.prototype, fieldName);
                    const modelMeta = Reflect.getMetadata(MODEL_META_KEY, type.prototype, fieldName);

                    return {
                        attribute: fieldName,
                        type: modelMeta.appType || 'string',
                        label: modelMeta.label || apiMeta.description,
                        required: apiMeta.required,
                        ...(modelMeta.items ? {items: modelMeta.items} : {}),
                    };
                }),
            };

            // fields
        });
        return result;
    }

    static exportEnums(types: any[]) {
        const result = {};
        types.forEach(type => {
            if (type.toArray) {
                result[type.name] = {
                    labels: type.toArray(),
                };
            }
        });
        return result;
    }
}
