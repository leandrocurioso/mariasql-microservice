const Middleware = require("./middleware");

class XApiKeyMiddleware extends Middleware {

    constructor({ configuration }) {
        super(...arguments);
    }

    getMethod() {
        return (req, res, next) => {
            if (req.get("X-Api-Key") !== this.configuration.server.xApiKey) {
                const err = new Error("X-Api-Key is invalid!");
                err.httpStatusCode = 403;
                return next(err);
            }
            return next();
        };
    }
}

module.exports = XApiKeyMiddleware;
