class MariaSqlConnectionPool {

  constructor({ configuration, mariaSql, genericPool }) {
    this.configuration = configuration;
    this.mariaSql = mariaSql;
    this.genericPool = genericPool;
  }

  getPool() {
    return this.genericPool.createPool(
    {
      create: () => this.mariaSql(this.configuration.database.maria),
      destroy: connection => connection.end()
    }, 
    { 
      min: this.configuration.database.maria.pool.min,
      max: this.configuration.database.maria.pool.max
    });
  }  

}

module.exports = MariaSqlConnectionPool;
