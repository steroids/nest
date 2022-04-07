import {ExceptionFilter, Catch, ArgumentsHost, HttpStatus} from '@nestjs/common';
import {Response} from 'express';
import {UserException} from "../../usecases/exceptions/";

@Catch(UserException)
export class UserExceptionFilter implements ExceptionFilter {
    catch(exception: UserException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const message = exception.message;
        response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message,
            })
        ;
    }
}
