export const STEROIDS_META_VALIDATOR_CLASSES = 'steroids_meta_validator_classes';

export const getFieldValidators = (MetaClass, fieldName) => {
    return Reflect.getMetadata(STEROIDS_META_VALIDATOR_CLASSES, MetaClass.prototype, fieldName) || [];
}

export function Validator(ValidatorClass) {
    return (object, fieldName) => {

        // Add field to list
        const validatorClasses = Reflect.getMetadata(STEROIDS_META_VALIDATOR_CLASSES, object, fieldName) || [];
        if (!validatorClasses.includes(ValidatorClass)) {
            validatorClasses.push(ValidatorClass);
        }
        Reflect.defineMetadata(STEROIDS_META_VALIDATOR_CLASSES, validatorClasses, object, fieldName);
    };
}

