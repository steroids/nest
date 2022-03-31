export class FieldValidatorException {
    public message;
    public params;

    constructor(message: string, params = null) {
        this.message = message;
        this.params = params;
    }
}
