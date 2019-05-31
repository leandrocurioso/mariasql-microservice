class Repository {

    constructor({ configuration, connection, changeCase, logger}) {
        this.configuration = configuration;
        this.connection = connection;
        this.changeCase = changeCase;
        this.logger = logger;
    }

    mapResult(values = [], schema = {}, firstPositionToObj = false) {
        if(!values || !Array.isArray(values) || !values.length) {
            return (firstPositionToObj ? null : []);
        }
        const mappedResult = values.map(value => {
            const obj = {};
            Object.keys(value).forEach(key => { 
                const parsedKey = this.changeCase.camelCase(key);
                switch(schema[parsedKey]) {
                    case 'integer':
                        obj[parsedKey] = parseInt(value[key], 10); 
                    break;
                    case 'boolean':
                        obj[parsedKey] = Boolean(parseInt(value[key], 10)); 
                    break;
                    case 'float':
                        obj[parsedKey] = parseFloat(value[key]); 
                    break;
                    default: 
                        obj[parsedKey] = value[key]; 
                }
            });
            return obj;
        });
        return (firstPositionToObj ? mappedResult[0] : mappedResult);
    }

    getQueryVerb(sql) {
        return sql.split(String.whiteSpace)[0].toUpperCase();
    }

    isTransaction(sqlVerbs) {
        if (!this.transactionVerbs) this.transactionVerbs = [ "INSERT", "UPDATE", "DELETE" ];
        return sqlVerbs.filter(verb => this.transactionVerbs.includes(verb)).length >= 2; 
    }

    async query(sql, params = {}) {
        this.connection = await this.connection;
        return new Promise((resolve, reject) => {
            const prep = this.connection.prepare(sql);
            this.connection.query(prep(params), (err, result) => {
                if (err) return reject(err);
                return resolve(result);
            });
        });
    }

    parseParams(params) {
        return Object.keys(params || []).map(key => {
            const bindParam = params[key].trim();
            const isBind = (
                typeof(bindParam) === 'string'
                && bindParam.substring(0, 2) === "{{"
                && bindParam.substring(bindParam.length - 2) === "}}"
            );
            let referencer = null;
            if (isBind) {
                const positions = bindParam.substring(2, (bindParam.length - 2)).trim().split(".");
                if (positions.length !== 2) {
                    const err = new Error(`Invalid reference bind for [${params[key]}]`);
                    err.httpStatusCode = 400;
                    throw err;
                }
                referencer = { key: positions[0], value:  positions[1] };
            }
            return { isBind, key, value: params[key], referencer };
        });
    }

    checkForbiddenSqlVerb(queryVerb) {
        if (this.configuration.service.repositoryForbiddenSqlVerbs.includes(queryVerb)) {
            const err = new Error(`SQL verb [${queryVerb}] is now allowed!`);
            err.httpStatusCode = 403;
            throw err;
        }
    }

    normalizeQueries(queries = []) {
        const mappedQueries = queries.map(query => {
            let trimedSql = query.sql.trim();
            if (trimedSql.substr(-1) !== ";") trimedSql += ";";
            const queryVerb = this.getQueryVerb(trimedSql);
            this.checkForbiddenSqlVerb(queryVerb);
            return Object.assign({}, query, {
                sql: trimedSql,
                queryVerb: this.getQueryVerb(trimedSql),
                params: this.parseParams(query.params)
            });
        });
        const sqlVerbs = mappedQueries.map(query => query.queryVerb);
        const isTransaction = this.configuration.service.repositoryAutoTransaction
            ? this.isTransaction(sqlVerbs)
            : false;
        return { isTransaction, queries: mappedQueries };
    }

    bindParam(params, resultsBag) {
        const resultParams = {};
        for(const param of params) {
            const found = resultsBag.find(x => param.isBind && x.key === param.referencer.key);
            if (param.isBind && !found) {
                const err = new Error(`Bind parameter [${param.referencer.key}.${param.referencer.value}] not found!`);
                err.httpStatusCode = 400;
                throw err;
            }
            if (found) {
                resultParams[param.key] = found.resultSet.info[param.referencer.value];
            } else {
                resultParams[param.key] = param.value;
            }
        }
        return resultParams;
    }

    sanitizeResult(parser, queryVerb, resultSet, onlyFirst) {
        if (this.transactionVerbs.includes(queryVerb)) {
            resultSet.info.numRows = parseInt(resultSet.info.numRows, 10);
            resultSet.info.affectedRows = parseInt(resultSet.info.affectedRows, 10);
            resultSet.info.insertId = parseInt(resultSet.info.insertId, 10);
        } else {
            resultSet = this.mapResult(resultSet, parser, onlyFirst);;
        }
        return resultSet;
    }

    async process(queriesBatch = [], xRequestId) {
        const { isTransaction, queries } = this.normalizeQueries(queriesBatch);
        const resultsBag = [];
        try {
            if (isTransaction) await this.query("START TRANSACTION;");
            for(const query of queries) {
                const bindedParams = this.bindParam(query.params, resultsBag);
                if (this.configuration.service.repositoryLogQuery) {
                    this.logger.info({ xRequestId, sql: query.sql, bindedParams });
                }
                let resultSet = await this.query(query.sql, bindedParams);
                resultSet = this.sanitizeResult(query.parser, query.queryVerb, resultSet, query.onlyFirst);
                resultsBag.push({ key: query.key, resultSet });
            }
            if (isTransaction) await this.query("COMMIT;");
            return resultsBag.map(result => ({ [result.key]: result.resultSet }));
        } catch(err) {
            if (isTransaction) await this.query("ROLLBACK;");
            if (this.configuration.service.repositoryLogQuery) {
                this.logger.error({ xRequestId, message: err.message, stack: err.stack });
            }
            throw err;
        }
    }

}

module.exports = Repository;
