const Controller = require('../controller');

class GetHealthController extends Controller {

  constructor({ configuration, logger, router, joi }) { 
    super({ configuration, logger, router, joi });
  }

  proxy() {
    return {
      httpVerb: 'GET',
      uri: '/',
      middlewares: [],
      doc: `
      /**
       * @swagger
       * /health:
       *    get:
       *      description: Checks the application health
       *      produces:
       *        - application/json
       *      responses:
       *        204:
       *          description: No-Content
       */`
    };
  }

  async route(req, res, next) {
    return await res.status(204).end(String.empty);
  }

}

module.exports = GetHealthController;
