import {IValidateFunction} from './IValidateFunction';

export const STEROIDS_META_CLASS_VALIDATORS = 'steroids_meta_validators';

export const getClassValidators = (MetaClass) => {
    return Reflect.getMetadata(STEROIDS_META_CLASS_VALIDATORS, MetaClass) || [];
}

export function ClassValidator(validatorInstance: IValidateFunction | any) {
    return (object) => {
        const validators = Reflect.getMetadata(STEROIDS_META_CLASS_VALIDATORS, object) || [];
        if (!validators.includes(validatorInstance)) {
            validators.push(validatorInstance);
        }
        Reflect.defineMetadata(STEROIDS_META_CLASS_VALIDATORS, validators, object);
    };
}
