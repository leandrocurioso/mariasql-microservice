class Logger {

  constructor({ configuration, path, winston, rootDir, timber, timberTransport, appName }) {
    this.configuration = configuration;
    this.path = path;
    this.winston = winston;
    this.rootDir = rootDir;
    this.timber = timber;
    this.timberTransport = timberTransport;
    this.appName = appName;
  }

  getInstance() {
    const logger =  this.winston.createLogger({
      level: this.configuration.logger.level,
      format: this.winston.format.combine(
        this.winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        this.winston.format.json()
      ),
      transports: this.configuration.logger.transports.map(transport => {
        switch(transport) {
          case 'timber':
            const timber = new this.timber(
              this.configuration.logger.timberOrganizationKey, 
              this.configuration.logger.timberSourceId
            );
            return new this.timberTransport(timber);
          case 'console':
            return new this.winston.transports.Console();
          case 'file':
            return new this.winston.transports.File({ filename: this.path.join(this.rootDir, this.configuration.logger.logFilename) })
        }
      })
    });

    const debug = logger.debug;
    const info = logger.info;
    const error = logger.error;
    const warn = logger.warn;
    const verbose = logger.verbose;
    const silly = logger.silly;
    const appName = this.appName;

    logger.debug = function(data) {
      return debug.call(this, Object.assign({}, data, { appName }));
    };
    logger.info = function(data) {
      return info.call(this, Object.assign({}, data, { appName}));
    };
    logger.error = function(data) {
      return error.call(this, Object.assign({}, data, { appName}));
    };
    logger.warn = function(data) {
      return warn.call(this, Object.assign({}, data, { appName}));
    };
    logger.verbose = function(data) {
      return verbose.call(this, Object.assign({}, data, { appName }));
    };
    logger.silly = function(data) {
      return silly.call(this, Object.assign({}, data, { appName }));
    };
    return logger;
  }

}

module.exports = Logger;
