import {validate, ValidatorOptions} from 'class-validator';
import {ValidationException} from '../exceptions/ValidationException';

export async function validateOrReject(dto: any, validatorOptions?: ValidatorOptions) {
    const errors = await validate(dto, validatorOptions);
    if (errors.length) {
        throw new ValidationException(errors);
    }
}
