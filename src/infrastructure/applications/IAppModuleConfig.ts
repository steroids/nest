export interface IAppModuleConfig {
    /**
     * Application name (default is `app`)
     */
    name: string,
    /**
     * Title for Swagger (default is `Application`)
     */
    title: string,
    /**
     * Application version (default `1.0`)
     */
    version: string,
    database?: {
        /**
         * Database host (value from `process.env.APP_DATABASE_HOST`)
         */
        host: string,
        /**
         * Database port (value from `process.env.APP_DATABASE_PORT`)
         */
        port: number,
        /**
         * Database name (value from `process.env.APP_DATABASE_NAME`)
         */
        database: string,
        /**
         * Username in the DBMS (value from `process.env.APP_DATABASE_USERNAME`)
         */
        username: string,
        /**
         * User password in DBMS (value from `process.env.APP_DATABASE_PASSWORD`)
         */
        password: string,
        [key: string]: any,
    },
    sentry?: {
        /**
         * DSN Sentry
         */
        dsn: string,
        /**
         * Application Environment for Sentry
         */
        environment: string,
        /**
         * Show detailed error info in HTTP responses.
         */
        exposeSentryErrorResponse?: boolean
    },
}
