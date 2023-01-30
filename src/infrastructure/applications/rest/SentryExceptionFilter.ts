import {ExceptionFilter, Catch, ArgumentsHost, HttpStatus, HttpException} from '@nestjs/common';
import {Response} from 'express';
import * as Sentry from '@sentry/node';
import { v4 as uuidv4 } from 'uuid';
import {CaptureContext} from '@sentry/types';

@Catch(Error)
export class SentryExceptionFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        if (exception instanceof HttpException) {
            const exceptionResponse = exception.getResponse();
            let payload: any = {
                statusCode: exception.getStatus(),
                message: exception.message,
            };
            if (typeof exceptionResponse === 'object') {
                payload = {...payload, ...exceptionResponse};
            } else {
                payload.response = exceptionResponse;
            }
            response
                .status(exception.getStatus())
                .json(payload);
            return;
        }

        const request = ctx.getRequest();
        const errorUid = uuidv4();

        const context: CaptureContext = {
            tags: {
                errorUid,
            },
            extra: {
                errorUid,
                url: request.url,
                ...request.headers,
            },
            user: {
                id: request?.user?.id,
            },
        };

        Sentry.captureException(exception, context);

        exception.message = 'Внутренняя ошибка сервера. ' + exception.message || '';
        if (errorUid) {
            exception.message += ` Ошибка #${errorUid}`;
        }

        const message = exception.message;
        response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message,
            });
    }
}
