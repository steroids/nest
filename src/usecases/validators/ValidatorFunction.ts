import {IValidatorParams} from '../interfaces/IValidator';

export const STEROIDS_META_VALIDATOR_FUNCTIONS = 'steroids_meta_validator_functions';

type IValidateFunction = (dto: any, params?: IValidatorParams) => Promise<void> | void;

export const getFieldValidatorFunctions = (MetaClass, fieldName) => {
    return Reflect.getMetadata(STEROIDS_META_VALIDATOR_FUNCTIONS, MetaClass.prototype, fieldName) || [];
}

export function ValidatorFunction(validateFunction: IValidateFunction) {
    return (object, fieldName) => {
        const validatorFunctions = Reflect.getMetadata(STEROIDS_META_VALIDATOR_FUNCTIONS, object, fieldName) || [];
        if (!validatorFunctions.includes(validateFunction)) {
            validatorFunctions.push(validateFunction);
        }
        Reflect.defineMetadata(STEROIDS_META_VALIDATOR_FUNCTIONS, validatorFunctions, object, fieldName);
    };
}
