import {IAppModuleConfig} from '../IAppModuleConfig';

export interface IRestAppModuleConfig extends IAppModuleConfig {
    /**
     * Maximum request body size
     */
    requestSizeLimit?: string,
    cors?: {
        /**
         * List of domains that are allowed to send requests to the server
         */
        allowDomains?: string[],
        /**
         * List of HTTP methods that are allowed for requests
         */
        allowMethods?: string[],
        /**
         * List of HTTP request headers that are allowed when sent to the server
         */
        allowHeaders?: string[],
    },
    /**
     * Flag indicating whether safe application termination is enabled
     * Enables .enableShutdownHooks() for NestJS app
     */
    gracefulEnabled?: boolean,
    /**
     * Is the application host localhost?
     * (value from `process.env.APP_LISTEN_LOCALHOST`)
     */
    isListenLocalhost?: boolean,
}
