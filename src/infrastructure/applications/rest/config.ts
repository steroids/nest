import {APP_FILTER} from '@nestjs/core';
import baseConfig from '../base/config';
import {IRestAppModuleConfig} from './IRestAppModuleConfig';
import {RequestExecutionExceptionFilter} from './filters/RequestExecutionExceptionFilter';
import {GracefulController} from "./graceful/GracefulController";
import {GracefulService} from "./graceful/GracefulService";
import {ValidationExceptionFilter} from '../../filters/ValidationExceptionFilter';
import {normalizeBoolean} from '../../decorators/fields/BooleanField';

export default {
    ...baseConfig,
    config: (): IRestAppModuleConfig => ({
        ...baseConfig.config(),
        isListenLocalhost: normalizeBoolean(process.env.APP_LISTEN_LOCALHOST),
    }),
    module: (config: IRestAppModuleConfig) => ({
        ...baseConfig.module(config),
        providers: [
            {
                provide: APP_FILTER,
                useClass: ValidationExceptionFilter,
            },
            {
                provide: APP_FILTER,
                useClass: RequestExecutionExceptionFilter,
            },
            config.gracefulEnabled && GracefulService,
        ].filter(Boolean),
        controllers: [
            config.gracefulEnabled && GracefulController,
        ].filter(Boolean),
    }),
};
