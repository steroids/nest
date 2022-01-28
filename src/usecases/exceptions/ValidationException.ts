import {ValidationError} from 'class-validator';
import {IFormError} from '../interfaces/IFormError';

export class ValidationException {
    public errors;

    constructor(errors: ValidationError[] | IFormError) {
        this.errors = errors;
    }
}
