import {MiddlewareConsumer, NestModule} from '@nestjs/common';
import {LoggerMiddleware} from '../middlewares/LoggerMiddleware';

export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(LoggerMiddleware)
            .forRoutes('*')
    }
}
