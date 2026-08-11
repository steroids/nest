import {ExceptionFilter, Catch, ArgumentsHost, HttpStatus} from '@nestjs/common';
import type {Response} from 'express';
import {ValidationException} from '../../usecases/exceptions';

@Catch(ValidationException)
export class ValidationExceptionFilter implements ExceptionFilter {
    catch(exception: ValidationException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        response
            // Используем код 200 потому что именно его ожидает фронтенд, это обсуждается в задаче steroids/dev#938
            .status(HttpStatus.OK)
            .json({
                statusCode: HttpStatus.BAD_REQUEST,
                errors: exception.errors,
            });
    }
}
