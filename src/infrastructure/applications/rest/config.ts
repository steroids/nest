import {APP_FILTER} from '@nestjs/core';
import baseConfig from '../base/config';
import {IRestAppModuleConfig} from './IRestAppModuleConfig';
import {GracefulController} from './graceful/GracefulController';
import {GracefulService} from './graceful/GracefulService';
import {ValidationExceptionFilter} from '../../filters/ValidationExceptionFilter';
import {normalizeBoolean} from '../../decorators/fields/BooleanField';

export default {
    ...baseConfig,
    config: (): IRestAppModuleConfig => ({
        ...baseConfig.config(),
        sentry: {
            dsn: process.env.APP_SENTRY_DSN,
            environment: process.env.APP_ENVIRONMENT,
            exposeSentryErrorResponse: normalizeBoolean(process.env.APP_ENVIRONMENT === 'dev' || process.env.SENTRY_EXPOSE_ERROR_RESPONSE),
        },
        isListenLocalhost: normalizeBoolean(process.env.APP_LISTEN_LOCALHOST),
    }),
    module: (config: IRestAppModuleConfig) => ({
        ...baseConfig.module(config),
        providers: [
            {
                provide: APP_FILTER,
                useClass: ValidationExceptionFilter,
            },
            config.gracefulEnabled && GracefulService,
        ].filter(Boolean),
        controllers: [
            config.gracefulEnabled && GracefulController,
        ].filter(Boolean),
    }),
};
