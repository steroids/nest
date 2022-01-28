import {validate, ValidatorOptions} from 'class-validator';
import {ValidationException} from '../exceptions/ValidationException';

export async function validateOrReject(model: any, validatorOptions?: ValidatorOptions){
    const errors = await validate(model, validatorOptions);
    if (errors.length) {
        throw new ValidationException(errors);
    }
}
