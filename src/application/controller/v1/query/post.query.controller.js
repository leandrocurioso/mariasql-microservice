const Controller = require('../../controller');

class GetQueryController extends Controller {

  constructor({ configuration, logger, router, joi, xApiKeyMiddleware }) { 
    super({ configuration, logger, router, joi });
    this.xApiKeyMiddleware = xApiKeyMiddleware;
  }

  proxy() {
    return {
      httpVerb: 'POST',
      uri: '/',
      middlewares: [ 
        this.xApiKeyMiddleware,
        this.validateRequest({
          body: this.joi.array().items( 
              this.joi.object().keys({
                key: this.joi.string().min(1).max(255).required(),
                sql: this.joi.string().min(12).max(this.configuration.controller.maximumSqlQueryLength).required(),
                params: this.joi.object().optional(),
                parser: this.joi.object().optional(),
                onlyFirst: this.joi.boolean().optional()
              }).required()
          ).min(1).unique((x, y) => x.key === y.key).required()
        })
      ],
      doc: `
      /**
       * @swagger
       * /v1/query:
       *    post:
       *      description: Executes a sql query
       *      produces:
       *        - application/json
       *      responses:
       *        200:
       *          description: No-Content
       *        400:
       *          description: Bad Request
       *        500:
       *          description: Internal Server Error
       */`
    };
  }

  async route(req, res, next) {
    const { scope, body } = req;
    const repositoryService = scope.resolve("repositoryService");
    const resultSets = await repositoryService.process(body, req['X-Request-Id'])
    return await res.status(200).json({ resultSets });
  }

}

module.exports = GetQueryController;
