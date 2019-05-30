class Controller {

  constructor({ configuration, logger, router, joi }) {
    this.configuration = configuration;
    this.logger = logger;
    this.router = router;
    this.joi = joi;
  }

  validateRequest(joiSchema) {
    return  (req, res, next) => {
      const expectedSchem = {};
      Object.keys(joiSchema).forEach(key => { expectedSchem[key] = req[key] });
      return this.joi.validate(expectedSchem, joiSchema, { abortEarly: true })
                     .then(() => next())
                     .catch(err => next(err));
    }
  }

  proxy() {
    throw new Error("You must define the proxy method in the child controller.");
  }

  register(controllerInfo) {
    const definition = this.proxy();
    definition.httpVerb = definition.httpVerb.toLowerCase();
    const definitionUri = definition.uri;
    const noSlashUri = ((definitionUri.slice(-1) === '/') ?  definitionUri.substring(0, definitionUri.length - 1) : definition.uri);
    console.log(`[${definition.httpVerb.toUpperCase()}] => ${controllerInfo.baseUri}${noSlashUri}`);
    this.router[definition.httpVerb](definition.uri, [...definition.middlewares, async (req, res, next) => {
      try {
        return await this.route(req, res, next);
      } catch (err) {
        return await req.scope.dispose().then(() => next(err));
      }
    }]);
    return this.router;
  }

}

module.exports = Controller;
