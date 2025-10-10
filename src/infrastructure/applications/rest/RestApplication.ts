import {NestFactory, Reflector} from '@nestjs/core';
import {json, urlencoded} from 'body-parser';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {VersioningType} from '@nestjs/common';
import {Connection} from '@steroidsjs/typeorm';
import {SentryExceptionFilter} from './SentryExceptionFilter';
import {SchemaSerializer} from './SchemaSerializer';
import {IRestAppModuleConfig} from './IRestAppModuleConfig';
import {CreateDtoPipe} from '../../pipes/CreateDtoPipe';
import {ValidationExceptionFilter} from '../../filters/ValidationExceptionFilter';
import {UserExceptionFilter} from '../../filters/UserExceptionFilter';
import {BaseApplication} from '../BaseApplication';
import {ModuleHelper} from '../../helpers/ModuleHelper';
import {AppModule} from '../AppModule';
import {getNewPermissions} from '../../utils/getNewPermissions';

/**
 * REST API application configuration class.
 */
export class RestApplication extends BaseApplication {
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

    /**
     * Application configuration (inherits from `BaseApplication`),
     * which is defined by the `IRestAppModuleConfig` interface.
     * @protected
     */
    protected _config: IRestAppModuleConfig;

    constructor(moduleClass = AppModule) {
        super();

        this._moduleClass = moduleClass;
    }

    /**
     * Override `initConfig` method from base class to initialize application configuration.
     * Uses `ModuleHelper.getConfig` to get user configuration and merges it with default values.
     * @protected
     */
    protected initConfig() {
        const custom = ModuleHelper.getConfig<IRestAppModuleConfig>(this._moduleClass);
        this._config = {
            requestSizeLimit: '32mb',
            ...custom,
            cors: {
                allowHeaders: [
                    'Origin',
                    'X-Requested-With',
                    'Content-Type',
                    'Accept',
                    'Authorization',
                    'Admin-Authorization',
                    'X-CSRF-Token',

                    // For file PUT upload
                    'If-None-Match',
                    'If-Modified-Since',
                    'Cache-Control',
                    'X-Requested-With',
                    'Content-Disposition',
                    'Content-Range',
                ],
                allowMethods: [
                    'POST',
                    'PUT',
                    'GET',
                    'OPTIONS',
                    'DELETE',
                ],
                ...custom?.cors,
            },
        };
    }

    /**
     * Initialize Swagger to generate API documentation.
     * Documentation will be available at the `/api/docs` endpoint.
     * @protected
     */
    protected initSwagger() {
        // Versioning
        this._app.setGlobalPrefix('/api/v1');
        this._app.enableVersioning({
            type: VersioningType.URI,
        });

        // Swagger config
        const swaggerConfig = new DocumentBuilder()
            .setTitle(this._config.title || 'Application')
            .setDescription('Документация REST API')
            .setVersion(this._config.version || '1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(this._app, swaggerConfig);
        SwaggerModule.setup('/api/docs', this._app, document);
    }

    /**
     * CORS (Cross-Origin Resource Sharing) setup. Based on the configuration,
     * adds allowed domains and request methods.
     * @protected
     */
    protected initCors() {
        // Cors
        const origin = [];
        (this._config.cors.allowDomains || []).forEach(domain => {
            if (domain.indexOf('://') !== -1) {
                origin.push(domain);
            } else {
                origin.push('https://' + domain);
                origin.push('http://' + domain);
            }
        });
        this._app.enableCors({
            credentials: true,
            origin,
            methods: this._config.cors.allowMethods,
            allowedHeaders: this._config.cors.allowHeaders,
        });
    }

    /**
     * Initialize global pipes used to validate request data (default is `CreateDtoPipe`).
     * @protected
     */
    protected initPipes() {
        // Validation
        this._app.useGlobalPipes(new CreateDtoPipe());
    }

    /**
     * Initialize global exception filters
     * (by default, `ValidationExceptionFilter` and `UserExceptionFilter` are used).
     * @protected
     */
    protected initFilters() {
        // Validation
        this._app.useGlobalFilters(new ValidationExceptionFilter());
        this._app.useGlobalFilters(new UserExceptionFilter());
    }

    /**
     * Initializes Sentry for error tracking and logging.
     * If the environment variable `APP_SENTRY_DSN` is set, the filter `SentryExceptionFilter` is added.
     * @protected
     */
    protected initSentry() {
        if (process.env.APP_SENTRY_DSN) {
            this._app.useGlobalFilters(new SentryExceptionFilter());
        }
    }

    /**
     * Initialization of global interceptors (default is `SchemaSerializer`).
     * @protected
     */
    protected initInterceptors() {
        this._app.useGlobalInterceptors(
            new SchemaSerializer(this._app.get(Reflector)),
        );
    }

    /**
     * Configuring request body parsers with request size limitation.
     * @protected
     */
    protected initSettings() {
        this._app.use(json({ limit: this._config.requestSizeLimit }));
        this._app.use(urlencoded({ extended: true, limit: this._config.requestSizeLimit }));
    }

    /**
     * Enable graceful application shutdown if the `gracefulEnabled` property is enabled in the configuration.
     * @protected
     */
    protected initGraceful() {
        if (this._config.gracefulEnabled) {
            this._app.enableShutdownHooks();
        }
    }

    protected async checkNewPermissions() {
        const connection = this._app.get(Connection);

        const newPermissions = await getNewPermissions(connection);

        if (newPermissions.length > 0) {
            throw new Error('The new permissions are available in the code,'
                + ' but they are not in the database. Generate and run migrations.');
        }
    }

    /**
     * Initializes the project.
     * Applies all `init*` methods, and also creates an application instance using `NestFactory.create`.
     */
    public async init() {
        await super.init();

        this._app = await NestFactory.create(this._moduleClass, {
            logger: ['error', 'warn'],
        });

        await this.checkNewPermissions();

        this.initSwagger();
        this.initCors();
        this.initPipes();
        this.initFilters();
        this.initSentry();
        this.initInterceptors();
        this.initSettings();
        this.initGraceful();
    }

    /**
     * Starts the application. Calls the `init` method and then starts the server on the specified port.
     */
    public async start() {
        await this.init();

        // Start application
        const port = parseInt(process.env.PORT, 10);
        await this._app.listen(
            port,
            () => console.log(`Server started http://localhost:${port}`), // eslint-disable-line no-console
        );
    }

    /**
     * Getter for `_app`
     */
    public getApp() {
        return this._app;
    }
}
