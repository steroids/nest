import {ExceptionFilter, Catch, ArgumentsHost} from '@nestjs/common';
import { Response } from 'express';
import {RequestExecutionException} from '../exceptions/RequestExecutionException';

@Catch(RequestExecutionException)
export class RequestExecutionExceptionFilter implements ExceptionFilter {
    catch(exception: RequestExecutionException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const status = exception.getStatus();
        const message = exception.getMessage();

        response
            .status(status)
            .json({
                statusCode: status,
                message,
            });
    }
}
