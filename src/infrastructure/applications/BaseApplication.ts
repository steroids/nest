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
        process.env.APP_IS_CLI = '1';
        process.env.APP_ENVIRONMENT = process.env.APP_ENVIRONMENT || 'dev';

        dotenv.config();
    }

    protected initConfig() {

    }

    protected initModules() {
        ModuleHelper.runInitializers();
    }

    public abstract start();
}
