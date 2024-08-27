import {IErrorsCompositeObject} from '../interfaces/IErrorsCompositeObject';

export class ValidationException {
    public errors: IErrorsCompositeObject;

    constructor(errors: IErrorsCompositeObject) {
        this.errors = errors;
    }
}
