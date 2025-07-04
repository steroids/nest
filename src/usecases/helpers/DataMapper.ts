import {has as _has} from 'lodash';
import {isObject as _isObject} from 'lodash';
import {getFieldOptions, getMetaFields, isMetaClass} from '../../infrastructure/decorators/fields/BaseField';
import {IRelationFieldOptions} from '../../infrastructure/decorators/fields/RelationField';
import {DECORATORS} from '@nestjs/swagger/dist/constants';
import {DeepPartial} from '@steroidsjs/typeorm';
import {
    getTransformCallbacks,
    ITransformType,
    TRANSFORM_TYPE_COMPUTABLE,
    TRANSFORM_TYPE_DEFAULT
} from '../../infrastructure/decorators/Transform';
import {IType} from '../interfaces/IType';
import {getModelBuilder} from '../../infrastructure/base/ModelTableStorage';

export class DataMapper {
    static create<T>(
        MetaClass: IType<T>,
        values: DeepPartial<T>,
        transformType?: ITransformType,
        skipBuilder?: boolean,
    ): T;

    static create<T>(
        MetaClass: IType<T>,
        values: Array<DeepPartial<T>>,
        transformType?: ITransformType,
        skipBuilder?: boolean,
    ): T[];

    /**
     * Creating an instance of the required class
     * taking into account the meta information embedded
     * using Fields decorators
     * @param MetaClass class whose instance will be created.
     * @param values object on the basis of which the class instance will be created.
     * This argument can be an array, in which case DataMapper will create an array.
     * @param transformType type of object transformation. Can take values:
     * - `TRANSFORM_TYPE_DEFAULT` - default value
     * - `TRANSFORM_TYPE_FROM_DB` - used when creating a model class when reading a record from the DB (when creating a `Model` from a `Table`).
     * - `TRANSFORM_TYPE_TO_DB` - used when creating an entity class when writing data to the DB (when creating a `Table` from a `Model`).
     * @param skipBuilder
     */
    static create<T>(
        MetaClass: IType<T>,
        values: DeepPartial<T> | DeepPartial<T>[],
        transformType: ITransformType = TRANSFORM_TYPE_DEFAULT,
        skipBuilder = false,
    ): T | T[] {
        // Check empty
        if (values === null) {
            return null;
        }
        if (Array.isArray(values)) {
            return values.map((value) => (
                this.create(MetaClass, value, transformType, skipBuilder)
            ));
        }

        const builder = !skipBuilder && getModelBuilder(MetaClass);
        if (builder) {
            return builder(values);
        }

        const result = new MetaClass();

        /**
         * Is schema implements [[IManualSchema]]?
         * @see IManualSchema
         */
        // TODO May be @BeforeCreate() decorator?
        if (result['updateFromModel'] && typeof result['updateFromModel'] === 'function' && values) {
            result['updateFromModel'](values);
            return result;
        }

        this.applyValues(result, values, transformType);

        return result;
    }

    static applyValues(object, values, transformType: ITransformType = TRANSFORM_TYPE_DEFAULT) {
        const MetaClass = object.constructor;
        const keys = isMetaClass(MetaClass) ? getMetaFields(MetaClass) : Object.keys(values);

        const transformTypes = transformType === TRANSFORM_TYPE_DEFAULT
            ? [transformType, TRANSFORM_TYPE_COMPUTABLE]
            : [transformType];

        keys.forEach(name => {
            const options = getFieldOptions(MetaClass, name);
            const sourceName = options?.sourceFieldName || name;

            if (!options && isMetaClass(MetaClass)) {
                return;
            }

            if (_has(values, sourceName)) {
                if (options?.appType === 'relation') {
                    if (options.isArray && Array.isArray(values[sourceName])) {
                        object[name] = values[sourceName]
                            .map(item => DataMapper.create(options.relationClass(), item, transformType));
                    } else if (_isObject(values[sourceName])) {
                        object[name] = DataMapper.create(options.relationClass(), values[sourceName], transformType);
                    } else {
                        object[name] = values[sourceName];
                    }
                } else {
                    object[name] = values[sourceName];
                }
            }

            for (let type of transformTypes) {
                if (_has(values, sourceName) || type !== TRANSFORM_TYPE_DEFAULT) {
                    const callbacks = getTransformCallbacks(MetaClass.prototype, name, type);
                    for (let callback of callbacks) {
                        const value = callback({
                            value: object[name],
                            item: values,
                            key: name,
                            transformType: type,
                            options,
                            object,
                        });
                        if (typeof value !== 'undefined') {
                            object[name] = value;
                        }
                    }
                }
            }
        });
    }

    static exportModels(types: any[]) {
        const result = {};
        types.forEach(type => {
            const fieldNames = getMetaFields(type);
            result[type.name] = {
                attributes: fieldNames.map(fieldName => {
                    const apiMeta = Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, type.prototype, fieldName);
                    const options = getFieldOptions(type, fieldName);

                    const fieldData = {
                        attribute: fieldName,
                        type: options.appType || 'string',
                        label: options.label || apiMeta.description,
                        required: apiMeta.required,
                        ...(options.enum
                            ? {
                                items: (Array.isArray(options.enum) ? options.enum[0] : options.enum).name
                            }
                            : {}),
                    };

                    if (fieldData.type === 'relation') {
                        fieldData['modelClass'] = (options as IRelationFieldOptions).relationClass().name;
                    }

                    return fieldData;
                }),
            };
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
