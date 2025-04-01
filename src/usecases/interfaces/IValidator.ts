import {ContextDto} from '../dtos/ContextDto';

export interface IValidatorParams {
    /**
     * Key of the field on which the `Validator` decorator is declared
     */
    name?: string,
    /**
     * Current version of the object from the database (this parameter is passed to `CrudService` when saving the record)
     */
    prevModel?: any,
    /**
     * Version of the object that is planned to be written to the database (this parameter is passed to `CrudService` when saving the record)
     */
    nextModel?: any,
    /**
     * `ContextDto` with information about the current session
     */
    context?: ContextDto,
    /**
     * Additional validation parameters that can be passed when calling `ValidationHelper`
     */
    params?: any,
}

export interface IValidator {
    validate(dto: any, params: IValidatorParams);
}
