import {IValidatorParams} from '../interfaces/IValidator';

export type IValidateFunction = (dto: any, params?: IValidatorParams) => Promise<void> | void;
