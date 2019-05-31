const Awilix = require('awilix');
const Express = require('express');
const Morgan = require('morgan');
const Path = require('path');
const GetEnv = require('getenv');
const DotEnv = require('dotenv');
const Http = require('http');
const Chalk = require('chalk');
const Winston = require('winston');
const FileSystem = require('fs');
const Joi = require('joi');
const Bluebird = require('bluebird');
const SwaggerJsDoc = require('swagger-jsdoc');
const SwaggerUiExpress = require('swagger-ui-express');
const UUID = require('uuid');
const ChildProcess = require("child_process");
const PackageJson = require('./package.json');
const MariaSql = require('mariasql');
const GenericPool = require('generic-pool');
const ChangeCase = require('change-case');
const ExpressBasicAuth = require("express-basic-auth");

const App = require('./app');

const {
    Configuration,
    Logger,
    PrototypeExtension,
    GetFilesRecursively,
    MariaSqlConnectionPool,
    Service
} = require('./src/infrastructure');

const {
    Controller,
    Middleware
} = require('./src/application');


class CompositionRoot {

    constructor({ environmentFilename, rootDir = Path.resolve(__dirname) }) {
        this.environmentFilename = environmentFilename;
        this.rootDir = rootDir;
    }

    setContainer(injectionMode = Awilix.InjectionMode.PROXY) {
        this.container = Awilix.createContainer({
            injectionMode
        });
        return this;
    }

    registerDependency() {
        this.registerThirdParty();
        this.preloadLayer();
        this.registerInfrastucture();
        this.registerFactory();
        this.registerService();
        this.registerMiddleware();
        this.registerController();
        this.container.register({
            container: Awilix.asValue(this.container)
        });
    }

    registerThirdParty() {
        this.container.register({
            awilix: Awilix.asValue(Awilix),
            express: Awilix.asValue({
                static: Express,
                app: Express()
            }),
            morgan: Awilix.asValue(Morgan),
            path: Awilix.asValue(Path),
            getEnv: Awilix.asValue(GetEnv),
            dotEnv: Awilix.asValue(DotEnv),
            http: Awilix.asValue(Http),
            chalk: Awilix.asValue(Chalk),
            winston: Awilix.asValue(Winston),
            fileSystem: Awilix.asValue(FileSystem),
            joi: Awilix.asValue(Joi),
            bluebird: Awilix.asValue(Bluebird),
            swaggerJsDoc: Awilix.asValue(SwaggerJsDoc),
            swaggerUiExpress: Awilix.asValue(SwaggerUiExpress),
            uuid: Awilix.asValue(UUID),
            childProcess: Awilix.asValue(ChildProcess),
            mariaSql: Awilix.asValue(MariaSql),
            genericPool: Awilix.asValue(GenericPool),
            changeCase: Awilix.asValue(ChangeCase)
        });
    }

    registerFactory() {
        this.container.register({
            appFactory: Awilix.asFunction(() => App).singleton(),
            router: Awilix.asFunction(() => this.container.resolve('express').static.Router()).transient()
        });
    }

    registerService() {
        this.container.register({
            repositoryService: Awilix.asClass(Service.RepositoryService).scoped()
        });
    }

    preloadLayer() {
        const prototypeExtension = new PrototypeExtension({
            bluebird: this.container.resolve('bluebird')
        });
        prototypeExtension.register();
    }

    registerMiddleware() {
        this.container.register({
            xApiKeyMiddleware: Awilix.asValue(new Middleware.XApiKeyMiddleware({
                configuration: this.configuration
            }).getMethod())
        });
    }

    registerController() {
        const controllerKeys = Object.keys(Controller);
        let controllers = controllerKeys.map(controllerKey => {
            const current = Controller[controllerKey];
            return current.controllers.map(controller => {
                const version = ((current.version) ? `/${current.version}` : '');
                const key = `${(controller.name.charAt(0).toLowerCase() + controller.name.slice(1))}${version.toUpperCase()}`;
                return {
                    key,
                    baseUri: version + current.baseUri,
                    class: controller
                };
            });
        });
        controllers = controllers.flat();
        controllers.forEach(controller => {
            this.container.register({
                [controller.key]: Awilix.asClass(controller.class).singleton()
            });
        });
        this.container.register({
            controllerKeys: Awilix.asValue(controllers.map(controller => ({
                key: controller.key,
                baseUri: controller.baseUri
            })))
        });
    }

    registerInfrastucture() {
        this.configuration = new Configuration({
            rootDir: this.rootDir,
            environmentFilename: this.environmentFilename,
            path: this.container.resolve('path'),
            getEnv: this.container.resolve('getEnv'),
            dotEnv: this.container.resolve('dotEnv')
        }).get();
        this.configuration.packageJson = PackageJson;

        this.container.register({
            configuration: Awilix.asValue(this.configuration),
            logger: Awilix.asValue(new Logger({
                configuration: this.configuration,
                path: this.container.resolve('path'),
                winston: this.container.resolve('winston'),
                rootDir: this.rootDir
            }).getInstance())
        });

        const mariaSqlConnectionPool = new MariaSqlConnectionPool({
            configuration: this.configuration,
            mariaSql: this.container.resolve("mariaSql"),
            genericPool: this.container.resolve("genericPool")
        }).getPool()

        this.container.register({
            getFilesRecursively: Awilix.asClass(GetFilesRecursively).singleton(),
            expressBasicAuth: Awilix.asValue(ExpressBasicAuth({
                users: { [this.configuration.swagger.username]: this.configuration.swagger.password },
                challenge: true
            })),
            connection: Awilix.asFunction(async () => await mariaSqlConnectionPool.acquire())
                .scoped().disposer(async (connection) => mariaSqlConnectionPool.destroy(await connection))
        });
    }

}

module.exports = CompositionRoot;