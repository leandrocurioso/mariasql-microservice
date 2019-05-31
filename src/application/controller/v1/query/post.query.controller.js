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
       *      description: Executes a sql queries in sequence
       *      produces:
       *        - application/json
       *      responses:
       *        200:
       *          description: Ok
       *        400:
       *          description: Bad Request
       *        403:
       *          description: Forbidden
       *        500:
       *          description: Internal Server Error
       *      parameters:
       *        - in: header
       *          name: X-Api-Key
       *          type: string
       *          required: true
       *          description: Api key to access server resources.
       *          example: c17d4c2c-6c5c-4267-9968-6b8b42d1d56f
       *        - in: header
       *          name: Content-Type
       *          default: application/json
       *          type: string
       *          required: true
       *          description: Request content type
       *          example: application/json
       *        - in: body
       *          type: array
       *          required: true
       *          description: Array of query objects
       *          schema:
       *           type: object
       *           properties:
       *            key:
       *              type: string 
       *              required: true
       *              description: The unique key of a query, this will be the namespace of result set
       *              example: listOfUsers
       *            sql:
       *              type: string 
       *              required: true
       *              description: SQL query
       *              example: SELECT name, balance, is_active FROM users WHERE id = :id;
       *            onlyFirst:
       *              type: boolean 
       *              required: false
       *              description: If you do not want to return an array pass true to get an object of the first result position.
       *              example: true
       *            params:
       *              type: object 
       *              required: false
       *              description: Param to be bind in query (Prepared Statement) to avoid SQL injection
       *              example: { id: 1 }
       *            parser:
       *              type: object 
       *              required: false
       *              description: By the default all results are returned as string, if you want to parse them for instance to integer pass this object.
       *              example: { id: 'integer', balance: 'float', is_active: 'boolean' }
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
