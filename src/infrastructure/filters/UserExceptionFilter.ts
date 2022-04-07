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
            // TODO#Warning - ставим код 200, чтобы форма на принимала текст ошибки
            .status(HttpStatus.OK)
            .json({
                statusCode: HttpStatus.BAD_REQUEST,
                message,
            })
        ;
    }
}
