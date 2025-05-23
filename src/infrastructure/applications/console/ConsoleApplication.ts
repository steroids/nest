import {NestFactory} from '@nestjs/core';
import {CommandModule, CommandService} from 'nestjs-command';
import {BaseApplication} from '../BaseApplication';
import {AppModule} from '../AppModule';

/**
 * CLI application configuration class.
 * Mainly used for working with migrations.
 */
export class ConsoleApplication extends BaseApplication {
    /**
     * An instance of an application built with NestJS.
     * @protected
     */
    protected _app: any;

    /**
     * The class of the application module (default is `AppModule`).
     * @protected
     */
    protected _moduleClass: any;

    constructor(moduleClass = AppModule) {
        super();

        this._moduleClass = moduleClass;
    }

    /**
     * Initialize the project environment.
     * Sets the environment variable `APP_IS_CLI` to `1`.
     * Calls the base class's environment initialization method.
     * @protected
     */
    protected initEnv() {
        process.env.APP_IS_CLI = '1';

        super.initEnv();
    }

    /**
     * Launches an application.
     * Executes a command passed from the terminal,
     * while creating an application context only for the duration of the command execution.
     */
    public async start() {
        await this.init();

        this._app = await NestFactory.createApplicationContext(this._moduleClass, {
            logger: ['warn', 'error'], // only errors
        });

        try {
            await this._app.select(CommandModule).get(CommandService).exec();
        } catch (error) {
            console.error(error); // eslint-disable-line no-console
        }

        await this._app.close();
    }
}
