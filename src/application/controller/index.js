module.exports.SwaggerController = { 
  baseUri: '/swagger', 
  controllers: [
    require('./swagger/get-api-docs.swagger.controller') 
  ]
};

module.exports.HealthController = { 
  baseUri: '/health', 
  controllers: [
    require('./health/get.health.controller') 
  ]
};

module.exports.QueryV1Controller = { 
  baseUri: '/query', 
  version: 'v1',
  controllers: [
    require('./v1/query/post.query.controller') 
  ]
};
