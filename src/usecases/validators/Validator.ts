import {IValidatorParams} from '../interfaces/IValidator';

export const STEROIDS_META_VALIDATORS = 'steroids_meta_validators';

export type IValidateFunction = (dto: any, params?: IValidatorParams) => Promise<void> | void;

export const getValidators = (MetaClass: any, fieldName?: string) => {
    const metadataParams: [string, any, string?] = fieldName
        ? [STEROIDS_META_VALIDATORS, MetaClass.prototype, fieldName]
        : [STEROIDS_META_VALIDATORS, MetaClass];

    return Reflect.getMetadata(...metadataParams) || [];
}

export function Validator(validatorInstance: IValidateFunction | any) {
    return (object: any, fieldName?: string) => {
        const getMetadataParams: [string, any, string?] = fieldName
            ? [STEROIDS_META_VALIDATORS, object, fieldName]
            : [STEROIDS_META_VALIDATORS, object];

        const validators = Reflect.getMetadata(...getMetadataParams) || [];

        if (!validators.includes(validatorInstance)) {
            validators.push(validatorInstance);
        }

        const defineMetadataParams: [string, any, any, string?] = fieldName
            ? [STEROIDS_META_VALIDATORS, validators, object, fieldName]
            : [STEROIDS_META_VALIDATORS, validators, object];

        Reflect.defineMetadata(...defineMetadataParams);
    };
}
