import {ContextDto} from '../dtos/ContextDto';

export interface IValidatorParams {
    name?: string,
    prevModel?: any,
    nextModel?: any,
    context?: ContextDto,
    params?: any,
}

export interface IValidator {
    validate(dto: any, params: IValidatorParams);
}
