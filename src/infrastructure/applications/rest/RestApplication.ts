import {NestFactory, Reflector} from '@nestjs/core';
import {json, urlencoded} from 'body-parser';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {INestApplication, VersioningType} from '@nestjs/common';
import {SentryExceptionFilter} from './SentryExceptionFilter';
import {SchemaSerializer} from './SchemaSerializer';
import {IRestAppModuleConfig} from './IRestAppModuleConfig';
import {CreateDtoPipe} from '../../pipes/CreateDtoPipe';
import {ValidationExceptionFilter} from '../../filters/ValidationExceptionFilter';
import {UserExceptionFilter} from '../../filters/UserExceptionFilter';
import {BaseApplication} from '../BaseApplication';
import {ModuleHelper} from '../../helpers/ModuleHelper';
import {AppModule} from '../AppModule';

/**
 * REST API application configuration class.
 */
export class RestApplication extends BaseApplication {
    /**
     * An instance of an application built with NestJS.
     * @protected
     */
    protected _app: INestApplication;

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
     *
     * (by default, `ValidationExceptionFilter` and `UserExceptionFilter` are used.
     * If the environment variable `APP_SENTRY_DSN` is set, the filter `SentryExceptionFilter` is added).
     * @protected
     */
    protected initFilters() {
        if (this._config.sentry) {
            this._app.useGlobalFilters(new SentryExceptionFilter(this._config.sentry.exposeSentryErrorResponse));
        }
        // Validation
        this._app.useGlobalFilters(new ValidationExceptionFilter());
        this._app.useGlobalFilters(new UserExceptionFilter());
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

    /**
     * Initializes the project.
     * Applies all `init*` methods, and also creates an application instance using `NestFactory.create`.
     */
    public async init() {
        await super.init();

        this._app = await NestFactory.create(this._moduleClass, {
            logger: ['error', 'warn'],
        });

        this.initSwagger();
        this.initCors();
        this.initPipes();
        this.initFilters();
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
