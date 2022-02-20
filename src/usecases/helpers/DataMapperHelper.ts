import {
    isObject as _isObject,
    isDate as _isDate,
    has as _has,
} from 'lodash';
import {
    getFieldOptions, getMetaFields, isMetaClass,
} from '../../infrastructure/decorators/fields/BaseField';
import {
    getTableNameFromModelClass,
    IRelationFieldOptions
} from '../../infrastructure/decorators/fields/RelationField';
import {DECORATORS} from '@nestjs/swagger/dist/constants';
import {Connection} from 'typeorm';
import {IRelationIdFieldOptions} from '../../infrastructure/decorators/fields/RelationIdField';

export class DataMapperHelper {

    static anyToModel(source, ModelClass, fieldNames = null) {
        if (!fieldNames) {
            fieldNames = getMetaFields(ModelClass);
        }

        const model = new ModelClass();

        fieldNames.forEach(fieldName => {


            if (_has(source, fieldName)) {
                const value = source[fieldName];

                if (_isObject(value) && !_isDate(value)) {
                    const modelMeta = getFieldOptions(ModelClass, fieldName) as IRelationFieldOptions;
                    if (modelMeta.appType === 'relation') {
                        model[fieldName] = this.anyToModel(value, modelMeta.modelClass());
                    } else {
                        // TODO Error?...
                    }
                } else {
                    model[fieldName] = value;
                }
            } else if (_has(source, fieldName + 'Id')) {
                model[fieldName + 'Id'] = source[fieldName + 'Id'];
            } else if (_has(source, fieldName + 'Ids')) {
                model[fieldName + 'Ids'] = source[fieldName + 'Ids'];
            }
        });

        return model;
    }

    static anyToSchema(source, SchemaClass) {
        const schema = new SchemaClass();
        getMetaFields(SchemaClass).forEach(key => {
            const meta = getFieldOptions(SchemaClass, key) as IRelationFieldOptions;
            if (meta.appType === 'relation' && !/Ids?$/.exec(key)) {
                let subSchemaClass = Reflect.getOwnMetadata('design:type', SchemaClass.prototype, key);
                if (!(typeof subSchemaClass === 'function')) {
                    subSchemaClass = meta.modelClass();
                }
                schema[key] = DataMapperHelper.anyToSchema(
                    _has(source, key) ? source[key] : null,
                    subSchemaClass
                );
            } else if (_has(source, key)) {
                schema[key] = source[key];
            }
        });

        return schema;
    }

    static anyToPlain(source) {
        // Array
        if (Array.isArray(source)) {
            return source.map(item => this.anyToPlain(item));
        }

        // Date
        if (_isDate(source)) {
            // TODO
            return source;
        }

        // Object
        if (_isObject(source)) {
            const keys = isMetaClass(source.constructor)
                ? getMetaFields(source.constructor)
                : Object.keys(source);

            return Object.keys(source).reduce((obj, key) => {
                if (!keys || keys.includes(key)) {
                    obj[key] = DataMapperHelper.anyToPlain(source[key]);
                }
                return obj;
            }, {});
        }

        // Scalar
        return source;
    }

    static modelToEntity(connection: Connection, model) {
        const entity: any = connection.getRepository(getTableNameFromModelClass(model.constructor)).create();

        getMetaFields(model.constructor).forEach(key => {
            if (!_has(model, key)) {
                return;
            }

            const value = model[key];

            const options = getFieldOptions(model.constructor, key);
            switch (options.appType) {
                case 'relationId':
                    // TODO 1. Нужно проверять есть ли такие айдишники в БД, иначе тайпорм будет пытаться создавать их
                    // TODO 2. Нужно придумать как кастомить primary key (id)
                    const primaryKey = 'id';

                    const relationIdOptions = options as IRelationIdFieldOptions;
                    const subRelationIdOptions = getFieldOptions(model.constructor, relationIdOptions.relationName) as IRelationFieldOptions
                    if (['ManyToMany', 'OneToMany'].includes(subRelationIdOptions.type)) {
                        // is array
                        entity[relationIdOptions.relationName] = (value || []).map(id => {
                            return this.modelToEntity(
                                connection,
                                this.anyToModel({[primaryKey]: id}, subRelationIdOptions.modelClass())
                            );
                        })
                    } else {
                        // is single id
                        entity[relationIdOptions.relationName] = value ? {[primaryKey]: value} : null;
                    }
                    break;
                case 'relation':
                    const relationOptions = options as IRelationFieldOptions;
                    if (_isObject(value)) {
                        entity[key] = this.modelToEntity(
                            connection,
                            this.anyToModel(value, relationOptions.modelClass())
                        );
                    }
                    break;

                default:
                    if (typeof value !== 'undefined') {
                        entity[key] = value;
                    }
            }
        });

        return entity;
    }

    static applyChangesToModel(model, changes) {
        getMetaFields(model.constructor).forEach(key => {
            const options = getFieldOptions(model.constructor, key);

            if (options.appType === 'primaryKey' && !model[key] && changes[key]) {
                model[key] = changes[key];
            }

            if (options.appType === 'relationId') {
                // TODO Нужно придумать как кастомить primary key (id)
                const primaryKey = 'id';
                const relationIdOptions = options as IRelationIdFieldOptions;

                if (!_has(changes, relationIdOptions.relationName)) {
                    return;
                }

                const value = changes[relationIdOptions.relationName];
                model[key] = Array.isArray(value)
                    ? value.map(obj => obj[primaryKey])
                    : (value ? value[primaryKey] : null);
                delete model[relationIdOptions.relationName];
                return;
            }

            if (!_has(changes, key)) {
                return;
            }

            if (_isObject(model[key]) && _isObject(changes[key])) {
                this.applyChangesToModel(model[key], changes[key]);
            } else {
                model[key] = changes[key];
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
                        ...(options.items ? {items: options.items} : {}),
                    };

                    if (fieldData.type === 'relation') {
                        fieldData['modelClass'] = (options as IRelationFieldOptions).modelClass().name;
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
