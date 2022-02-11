import {
    isObject as _isObject,
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

    static applyFields(target: Record<string, unknown> | any, source: any, fields: string[] = null) {
        if (_isObject(source)) {
            Object.assign(target, source); // TODO

            // if (!_isPlainObject(source)) {
            //     source = instanceToPlain(source);
            // }
            //
            // if (!fields) {
            //     fields = Object.getOwnPropertyNames(target);
            // }
            // fields.forEach(field => {
            //     if (_has(source, field)) {
            //         if (_isObject(source[field])) {
            //             // TODO Nested objects...
            //         } else {
            //             target[field] = source[field];
            //         }
            //     }
            // });
        }
    }
}
