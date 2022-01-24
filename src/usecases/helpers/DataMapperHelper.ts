import {
    isPlainObject as _isPlainObject,
    isObject as _isObject,
    has as _has,
} from 'lodash';
import {instanceToPlain} from 'class-transformer';

export class DataMapperHelper {
    static anyToModel(obj, ModelClass) {
        const result = new ModelClass();
        Object.assign(result, obj); // TODO
        return result;
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
