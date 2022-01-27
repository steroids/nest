import {ExceptionFilter, Catch, ArgumentsHost, HttpStatus} from '@nestjs/common';
import { Response } from 'express';
import {ValidationError} from 'class-validator';
import {ValidationException} from '../../usecases/exceptions/ValidationException';

@Catch(ValidationException)
export class ValidationExceptionFilter implements ExceptionFilter {
    catch(exception: ValidationException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        let errors;
        if (Array.isArray(exception.errors) && exception.errors[0] instanceof ValidationError) {
            errors = exception.errors.reduce(
                (result: any, item) => {
                    result[item.property] = []
                        .concat(Object.values(item.constraints));
                    return result;
                },
                {},
            );
        } else {
            errors = exception.errors;
        }
        response
            .status(HttpStatus.BAD_REQUEST)
            .json({
                statusCode: HttpStatus.BAD_REQUEST,
                errors,
            });
    }
}