import {IErrorsCompositeObject} from '../interfaces/IErrorsCompositeObject';

export class ClassValidatorException {
    public params: IErrorsCompositeObject;

    constructor(params: IErrorsCompositeObject) {
        this.params = params;
    }
}
