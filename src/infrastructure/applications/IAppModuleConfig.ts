import {Params as LoggerParams} from 'nestjs-pino/params';

export interface IAppModuleConfig {
    name: string,
    title: string,
    version: string,
    database?: {
        host: string,
        port: number,
        database: string,
        username: string,
        password: string,
        [key: string]: any,
    },
    sentry?: {
        dsn: string,
        environment: string,
    },
    logger?: LoggerParams,
}
