import {validate, ValidatorOptions} from 'class-validator';
import {ValidationException} from '../exceptions';

const defaultValidatorOptions: ValidatorOptions = {
    whitelist: true,
};

export async function validateOrReject(dto: any, validatorOptions?: ValidatorOptions) {
    const errors = await validate(
        dto,
        {...defaultValidatorOptions, ...validatorOptions},
    );
    if (errors.length) {
        throw new ValidationException(errors);
    }
}
