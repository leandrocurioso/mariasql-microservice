class Configuration {

  constructor({ rootDir, environmentFilename, path, getEnv, dotEnv }) {
      this.rootDir = rootDir;
      this.environmentFilename = environmentFilename;
      this.path = path;
      this.getEnv = getEnv;
      this.dotEnv = dotEnv;
  }

  get() {
      this.dotEnv.config({ path: this.path.join(this.rootDir, this.environmentFilename) });
      const config = {
        rootDir: this.rootDir,
        nodeEnv: this.getEnv.string('NODE_ENV', 'development'),
        system: {
          controllerPath: this.getEnv.string('SYSTEM_CONTROLLER_PATH')
        },
        server: {
            name: this.getEnv.string('SERVER_NAME', 'server'),
            port: this.getEnv.int('SERVER_PORT', 3000),
            xApiKey: this.getEnv.string('SERVER_X_API_KEY'),
            timezone:this.getEnv.string('SERVER_TIMEZONE', 'UTC')
        },
        logger: {
          transports: this.getEnv.array('LOGGER_TRANSPORTS', 'string', [ 'console' ]),
          logFilename: this.getEnv.string('LOGGER_LOG_FILENAME', 'application.log'),
          level: this.getEnv.string('LOGGER_LOG_LEVEL', 'info')
        },
        database: {
          maria: {
              host: this.getEnv.string("DB_MARIA_HOST", "127.0.0.1"),
              db: this.getEnv.string("DB_MARIA_DATABASE"),
              user: this.getEnv.string("DB_MARIA_USER"),
              password: this.getEnv.string("DB_MARIA_PASSWORD"),
              port: this.getEnv.int("DB_MARIA_PORT", 3306),
              multiStatements: false,
              charset: this.getEnv.string("DB_MARIA_CHARSET", "utf8"),
              connTimeout: this.getEnv.int("DB_MARIA_CONNECTION_TIMEOUT", 120),
              pingInactive: this.getEnv.int("DB_MARIA_PING_INACTIVE", 60000),
              pingWaitRes: this.getEnv.int("DB_MARIA_PING_WAIT_RESPONSE", 60000),
              pool: {
                min: this.getEnv.int("DB_MARIA_MIN_CONNECTIONS", 1),
                max: this.getEnv.int("DB_MARIA_MAX_CONNECTIONS", 1)
              }
          }
        },
        controller: {
          maximumSqlQueryLength: this.getEnv.int("CONTROLLER_MAXIMUM_SQL_QUERY_LENGTH", 1000)
        },
        service: {
          repositoryAutoTransaction: Boolean(this.getEnv.int("REPOSITORY_SERVICE_AUTO_TRANSACTION", 1)),
          repositoryForbiddenSqlVerbs: this.getEnv.array('REPOSITORY_SERVICE_FORBIDDEN_SQL_VERBS', 'string', [ "DROP", "TRUNCATE", "CREATE", "ALTER" ])
        }
      }; 
      process.env.NODE_ENV = config.nodeEnv;
      process.env.TZ = config.server.timezone;
      return config;
  }

}

module.exports = Configuration;
