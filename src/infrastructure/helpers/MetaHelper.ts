import {Connection} from 'typeorm';
import {DECORATORS} from '@nestjs/swagger/dist/constants';
import {MODEL_FIELD_NAMES_KEY, MODEL_META_KEY} from '../decorators/fields/BaseField';
import {IAllFieldOptions} from '../decorators/fields';
import {ISchemaOptions, SCHEMA_META_KEY} from '../decorators/Schema';
import {DataMapperHelper} from '../../usecases/helpers/DataMapperHelper';

export class MetaHelper {
    static getFieldOptions(ModelClass, fieldName): IAllFieldOptions {
        return ModelClass && Reflect.hasMetadata(MODEL_META_KEY, ModelClass.prototype, fieldName)
            ? Reflect.getMetadata(MODEL_META_KEY, ModelClass.prototype, fieldName)
            : null;
    }

    static getFieldNames(AnyClass): string[] {
        return AnyClass && Reflect.hasMetadata(MODEL_FIELD_NAMES_KEY, AnyClass.prototype)
            ? Reflect.getMetadata(MODEL_FIELD_NAMES_KEY, AnyClass.prototype)
            : null;
    }

    static getSchemaOptions(SchemaClass): ISchemaOptions {
        return SchemaClass && Reflect.hasMetadata(SCHEMA_META_KEY, SchemaClass.prototype)
            ? Reflect.getMetadata(SCHEMA_META_KEY, SchemaClass.prototype)
            : null;
    }

    static exportModels(connection: Connection, types: any[]) {

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
