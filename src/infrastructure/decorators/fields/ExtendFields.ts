import {DECORATORS} from '@nestjs/swagger/dist/constants';
import {ExtendField} from './ExtendField';

export function ExtendFields(modelClass) {
    return (object) => {
        const properties = Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, modelClass.prototype);
        (properties || []).forEach(propertyName => {
            propertyName = propertyName.replace(/^:/, '');

            console.log(11, Object.keys(object.prototype));
            //ExtendField(modelClass)(object.prototype, propertyName);
        });
    };
}
