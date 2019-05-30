class Logger {

  constructor({ configuration, path, winston, rootDir }) {
    this.configuration = configuration;
    this.path = path;
    this.winston = winston;
    this.rootDir = rootDir;
  }

  getInstance() {
    return this.winston.createLogger({
      level: this.configuration.logger.level,
      format: this.winston.format.combine(
        this.winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        this.winston.format.json()
      ),
      transports: this.configuration.logger.transports.map(transport => {
        switch(transport) {
          case 'console':
            return new this.winston.transports.Console();
          case 'file':
            return new this.winston.transports.File({ filename: this.path.join(this.rootDir, this.configuration.logger.logFilename) })
        }
      })
    });
  }

}

module.exports = Logger;
