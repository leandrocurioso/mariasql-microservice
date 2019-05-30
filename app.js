class App {

	constructor({ container }) {
		this.container = container;
	}

	setProperties() {
		this.configuration = this.container.resolve('configuration');
		this.express = this.container.resolve('express');
		this.morgan = this.container.resolve('morgan');
		this.uuid = this.container.resolve('uuid');
	}

	registerMiddleware() {
		this.express.app.disable('x-powered-by');
		this.express.app.set('port', this.configuration.server.port);
		if (this.configuration.nodeEnv !== 'production') this.express.app.use(this.morgan('dev'));
		this.express.app.use(this.express.static.json());
		this.express.app.use(this.express.static.urlencoded({
			extended: false
		}));

		this.express.app.use((req, res, next) => {
			const currentXRequestId = req.get("X-Request-Id");
			const newXRequestId = this.uuid.v4();
			if (!currentXRequestId) {
				req["X-Request-Id"] = newXRequestId;
				res.set("X-Request-Id", newXRequestId);
			} else {
				req["X-Request-Id"] = currentXRequestId;
				res.set("X-Request-Id", currentXRequestId);
			}
			return next();
		});

		this.express.app.use((req, res, next) => {
			req.scope = this.container.createScope();
			const json = res.json;
			const end = res.end;
			const send = res.send;
			res.json = function(data) {
				return req.scope.dispose().then(() => json.call(this, data));
			};
			res.end = function(str) {
				return req.scope.dispose().then(() => end.call(this, str));
			};
			res.send = function(str) {
				return req.scope.dispose().then(() => send.call(this, str));
			};
			return next();
		});
	}

	registerRoute() {
		this.container.resolve("controllerKeys").forEach(controllerInfo => {
			const currentController = this.container.resolve(controllerInfo.key);;
			this.express.app.use(controllerInfo.baseUri, currentController.register(controllerInfo));
		});
	}

	registerErrorMiddleware() {
		this.express.app.use((req, res, next) => {
			const err = new Error("Not Found");
			err.httpStatusCode = 404;
			return next(err);
		});

		this.express.app.use((err, req, res, next) => {
			if (err.isJoi) return res.status(400).json({
				validationErrors: err.details
			});
			return res.status(err.httpStatusCode || 500).json({
				message: err.message,
				stack: ((this.configuration.nodeEnv !== 'production') ? err.stack : undefined)
			})
		});
	}

	start() {
		this.setProperties();
		this.registerMiddleware();
		this.registerRoute();
		this.registerErrorMiddleware();
	}

}

module.exports = App;