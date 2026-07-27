import * as dotenv from 'dotenv';
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

    /**
     * The project initialization method, which causes
     * three other methods (`initEnv`, `initConfig`, `initModules`).
     * @protected
     */
    protected async init() {
        this.initEnv();
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
