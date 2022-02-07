import {ExceptionFilter, Catch, ArgumentsHost, HttpStatus} from '@nestjs/common';
import { Response } from 'express';
import {ValidationError} from 'class-validator';
import {ValidationException} from '../../usecases/exceptions/ValidationException';

@Catch(ValidationException)
export class ValidationExceptionFilter implements ExceptionFilter {
    parseErrors(errors) {
        if (Array.isArray(errors) && errors[0] instanceof ValidationError) {
            return errors.reduce(
                (result: any, item) => {
                    if (item.constraints) {
                        result[item.property] = [].concat(Object.values(item.constraints));
                    }
                    if (item.children?.length > 0) {
                        result[item.property] = this.parseErrors(item.children);
                    }
                    return result;
                },
                {},
            );
        }
        return errors;
    }

    catch(exception: ValidationException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const errors = this.parseErrors(exception.errors);

        response
            // TODO#Warning - ставим код 200, чтобы форма на фронте принимала массив ошибок
            .status(HttpStatus.OK)
            .json({
                statusCode: HttpStatus.BAD_REQUEST,
                errors,
            });
    }
}
