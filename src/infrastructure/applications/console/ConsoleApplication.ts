import {NestFactory} from '@nestjs/core';
import {CommandModule, CommandService} from 'nestjs-command';
import {BaseApplication} from '../BaseApplication';

export class ConsoleApplication extends BaseApplication{

    protected _app: any;
    protected _moduleClass: any;

    constructor(AppModule) {
        super();

        this._moduleClass = AppModule;
    }

    public async start() {
        this._app = await NestFactory.createApplicationContext(this._moduleClass, {
            logger: ['warn', 'error'], // only errors
        });

        await this.init();

        try {
            await this._app.select(CommandModule).get(CommandService).exec();
        } catch (error) {
            console.error(error); // eslint-disable-line no-console
        }

        await this._app.close();
    }
}
