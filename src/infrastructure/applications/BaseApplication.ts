import * as dotenv from 'dotenv';
import {ModuleHelper} from '../helpers/ModuleHelper';

export abstract class BaseApplication {
    protected _config: any;

    protected async init() {
        this.initEnv();
        this.initConfig();
        this.initModules();
    }

    protected initEnv() {
        dotenv.config();

        if (!process.env.APP_ENVIRONMENT) {
            throw new Error('APP_ENVIRONMENT is not found in env file');
        }
    }

    protected initConfig() {

    }

    protected initModules() {
        ModuleHelper.runInitializers();
    }

    public abstract start();
}
