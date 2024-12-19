import {RequestMethod} from '@nestjs/common';
import {StdSerializedResults} from 'pino-http';
import {Params as LoggerParams} from 'nestjs-pino/params';
import {normalizeBoolean} from '../decorators/fields/BooleanField';

export default {
    exclude: [{method: RequestMethod.ALL, path: 'health'}],
    pinoHttp: {
        level: process.env.APP_LOG_LEVEL || 'info',
        autoLogging: normalizeBoolean(process.env.APP_LOG_HTTP),
        transport:
            process.env.APP_ENVIRONMENT === 'dev'
                ? {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        singleLine: true,
                        colorizeObjects: true,
                    },
                }
                : undefined,
        mixin() {
            const result: Record<string, any> = {};

            if (normalizeBoolean(process.env.APP_LOG_MEMORY_USAGE)) {
                const formatMemoryUsage = (metric: number) =>
                    `${Math.round((metric / 1024 / 1024) * 100) / 100} MB`;
                const memoryData = process.memoryUsage();

                result.memoryUsage = {
                    rss: formatMemoryUsage(memoryData.rss),
                    heapTotal: formatMemoryUsage(memoryData.heapTotal),
                    heapUsed: formatMemoryUsage(memoryData.heapUsed),
                    external: formatMemoryUsage(memoryData.external),
                };
            }

            return result;
        },
        serializers: {
            res(res: StdSerializedResults['res']) {
                if (!normalizeBoolean(process.env.APP_LOG_REQUEST_HEADERS)) {
                    res.headers = {};
                }

                return res;
            },
            req(req: StdSerializedResults['req']) {
                if (!normalizeBoolean(process.env.APP_LOG_REQUEST_HEADERS)) {
                    req.headers = {};
                }

                return req;
            },
        },
    },
} as LoggerParams;
