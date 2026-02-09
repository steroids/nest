import * as dotenv from 'dotenv';
import * as Sentry from '@sentry/nestjs';
import {ModuleHelper} from '../helpers/ModuleHelper';

/**
 * Abstract class for creating application configuration classes.
 */
export abstract class BaseApplication {
    /**
     * The object of the project configuration.
     * @protected
     */
    protected _config: any;

    protected isSentryInitialized: boolean = false;

    /**
     * The project initialization method, which causes
     * three other methods (`initEnv`, `initConfig`, `initModules`).
     * @protected
     */
    protected async init() {
        this.initEnv();
        this.initSentry();
        this.initConfig();
        this.initModules();
    }

    /**
     * Method for initializing environment variables.
     * It uses `dotenv` library to load variables from `.env` file.
     * If `APP_ENVIRONMENT` variable is not present in the environment file,
     * the error `APP_ENVIRONMENT is not found in env file` is thrown.
     * @protected
     */
    protected initEnv() {
        dotenv.config();

        if (!process.env.APP_ENVIRONMENT) {
            throw new Error('APP_ENVIRONMENT is not found in env file');
        }
    }

    /**
     * An empty method that can be overridden in class inheritors
     * to initialize the application configuration.
     * @protected
     */
    protected initConfig() {

    }

    /**
     * Initializes Sentry for error tracking and logging.
     *
     * Sentry also automatically configures `process.on('uncaughtException')` and `process.on('unhandledRejection')` to log and handle these events,
     * only on `uncaughtException` the process will be exited, but on `unhandledRejection` it will continue to work.
     */
    protected initSentry(): void {
        if (!process.env.APP_SENTRY_DSN) {
            return;
        }

        Sentry.init({
            dsn: process.env.APP_SENTRY_DSN,
            environment: process.env.APP_ENVIRONMENT,
            integrations: [
                Sentry.onUncaughtExceptionIntegration({
                    onFatalError: async (err) => {
                        if (err.name === 'SentryError') {
                            console.log(err);
                        } else {
                            Sentry.getCurrentScope()
                                .getClient()
                                .captureException(err);
                            process.exit(1);
                        }
                    },
                }),
                Sentry.onUnhandledRejectionIntegration({
                    mode: 'warn',
                }),
            ],
        });

        this.isSentryInitialized = true;
    }

    /**
     * Method for initializing application modules.
     * It uses the `ModuleHelper` class.
     * @protected
     */
    protected initModules() {
        ModuleHelper.runInitializers();
    }

    /**
     * Abstract method for starting the application.
     */
    public abstract start();
}
