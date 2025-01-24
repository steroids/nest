import {IValidatorParams} from '../interfaces/IValidator';

export const STEROIDS_META_VALIDATORS = 'steroids_meta_validators';

export type IValidateFunction = (dto: any, params?: IValidatorParams) => Promise<void> | void;

export const getValidators = (MetaClass, fieldName?) => {
    const metadataParams: [string, any, string?] = fieldName ? [STEROIDS_META_VALIDATORS, MetaClass.prototype, fieldName] : [STEROIDS_META_VALIDATORS, MetaClass];
    return Reflect.getMetadata(...metadataParams) || [];
}

export function Validator(validatorInstance: IValidateFunction | any) {
    return (object, fieldName?) => {
        const metadataParams: [string, any, string?] = fieldName ? [STEROIDS_META_VALIDATORS, object, fieldName] : [STEROIDS_META_VALIDATORS, object];

        const validators = Reflect.getMetadata(...metadataParams) || [];

        if (!validators.includes(validatorInstance)) {
            validators.push(validatorInstance);
        }

        metadataParams.splice(1, 0, validators)

        Reflect.defineMetadata(...metadataParams);
    };
}
