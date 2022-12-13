import {IValidatorParams} from '../interfaces/IValidator';

export const STEROIDS_META_VALIDATOR_CLASSES = 'steroids_meta_validator_classes';
export const STEROIDS_META_VALIDATOR_FUNCTIONS = 'steroids_meta_validator_functions';

type IValidateFunction = (dto: any, params?: IValidatorParams) => Promise<void> | void;

export const getFieldValidators = (MetaClass, fieldName) => {
    return Reflect.getMetadata(STEROIDS_META_VALIDATOR_CLASSES, MetaClass.prototype, fieldName) || [];
}

export const getFieldValidatorsFunctions = (MetaClass, fieldName) => {
    return Reflect.getMetadata(STEROIDS_META_VALIDATOR_FUNCTIONS, MetaClass.prototype, fieldName) || [];
}

export function Validator(validatorInstance: IValidateFunction | any) {
    return (object, fieldName) => {

        let metaKey = STEROIDS_META_VALIDATOR_CLASSES;
        if (typeof validatorInstance === 'function') {
            metaKey = STEROIDS_META_VALIDATOR_FUNCTIONS;
        }
        // Add field to list
        const validators = Reflect.getMetadata(metaKey, object, fieldName) || [];
        if (!validators.includes(validatorInstance)) {
            validators.push(validatorInstance);
        }
        Reflect.defineMetadata(metaKey, validators, object, fieldName);
    };
}
