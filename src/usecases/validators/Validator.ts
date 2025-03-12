import {IValidator, IValidatorParams} from '../interfaces/IValidator';
import {IType} from '../interfaces/IType';

export const STEROIDS_META_VALIDATORS = 'steroids_meta_validators';

export type ValidateFunctionType = (dto: any, params?: IValidatorParams) => Promise<void> | void;

export const getValidators = (MetaClass: any, fieldName?: string) => {
    const metadataParams: [string, any, string?] = fieldName
        ? [STEROIDS_META_VALIDATORS, MetaClass.prototype, fieldName]
        : [STEROIDS_META_VALIDATORS, MetaClass];

    return Reflect.getMetadata(...metadataParams) || [];
}

export function Validator(validatorInstance: ValidateFunctionType | IType<IValidator>) {
    return (target: any, fieldName?: string) => {
        const getMetadataParams: [string, any, string?] = fieldName
            ? [STEROIDS_META_VALIDATORS, target, fieldName]
            : [STEROIDS_META_VALIDATORS, target];

        const validators = Reflect.getMetadata(...getMetadataParams) || [];

        if (!validators.includes(validatorInstance)) {
            validators.push(validatorInstance);
        }

        const defineMetadataParams: [string, any, any, string?] = fieldName
            ? [STEROIDS_META_VALIDATORS, validators, target, fieldName]
            : [STEROIDS_META_VALIDATORS, validators, target];

        Reflect.defineMetadata(...defineMetadataParams);
    };
}
