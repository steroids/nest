import {Injectable, Logger, NestMiddleware} from '@nestjs/common';
import {NextFunction, Request, Response} from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');

    use(request: Request, response: Response, next: NextFunction) {
        const startAt = Date.now();

        response.on('finish', () => {
            const {method, originalUrl} = request;
            const {statusCode} = response;

            const message = `Status: ${statusCode} Method: ${method} Path: ${originalUrl} Duration: ${Date.now() - startAt} ms`;

            if (statusCode >= 500) {
                this.logger.error(message);
                return;
            }

            if (statusCode >= 400) {
                this.logger.warn(message);
                return;
            }

            this.logger.debug(message);
        });

        next();
    }
}
