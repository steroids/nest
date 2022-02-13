import {
    isObject as _isObject,
    isDate as _isDate,
    has as _has,
} from 'lodash';
import {MODEL_FIELD_NAMES_KEY} from '../../infrastructure/decorators/fields/BaseField';
import {MetaHelper} from '../../infrastructure/helpers/MetaHelper';
import {IRelationFieldOptions} from '../../infrastructure/decorators/fields/RelationField';

export class DataMapperHelper {
    static getKeys(object) {
        return Reflect.getMetadata(MODEL_FIELD_NAMES_KEY, object.prototype) || [];
    }

    static anyToModel(source, ModelClass, fieldNames = null) {
        if (!fieldNames) {
            fieldNames = this.getKeys(ModelClass);
        }

        const model = new ModelClass();

        fieldNames.forEach(fieldName => {
            if (_has(source, fieldName)) {
                const value = source[fieldName];

                if (_isObject(value)) {
                    const modelMeta = MetaHelper.getFieldOptions(ModelClass, fieldName) as IRelationFieldOptions;
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
        const keys = MetaHelper.getFieldNames(SchemaClass);
        keys.forEach(key => {
            const meta = MetaHelper.getFieldOptions(SchemaClass, key) as IRelationFieldOptions;
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
            const keys = MetaHelper.getFieldNames(source.constructor);

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
}
