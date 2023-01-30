import {APP_FILTER} from '@nestjs/core';
import baseConfig from '../base/config';
import {IRestAppModuleConfig} from './IRestAppModuleConfig';
import {ValidationExceptionFilterCustom} from './filters/ValidationExceptionFilterCustom';
import {RequestExecutionExceptionFilter} from './filters/RequestExecutionExceptionFilter';

export default {
    ...baseConfig,
    module: (config: IRestAppModuleConfig) => ({
        ...baseConfig.module(config),
        providers: [
            {
                provide: APP_FILTER,
                useClass: ValidationExceptionFilterCustom,
            },
            {
                provide: APP_FILTER,
                useClass: RequestExecutionExceptionFilter,
            },
        ],
    }),
};
