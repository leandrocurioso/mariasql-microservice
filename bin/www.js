const CompositionRoot = require('../composition-root');

class Server {

    constructor({ compositionRoot }) {
        this.compositionRoot = compositionRoot;
    }

    setDependency() {
        const appFactory = this.compositionRoot.container.resolve("appFactory");
        this.configuration = this.compositionRoot.container.resolve("configuration");
        this.express = this.compositionRoot.container.resolve("express");
        this.http = this.compositionRoot.container.resolve("http");
        this.chalk = this.compositionRoot.container.resolve("chalk");
        this.app = new appFactory({
            container: this.compositionRoot.container
        });
    }

    start() {
        this.setDependency();
        this.app.start();
        const port = this.normalizePort(process.env.PORT || this.configuration.server.port);
        this.express.app.set('port', port);
        this.server = this.http.createServer(this.express.app);
        this.server.listen(port);
        this.server.on('error', this.getOnError(port));
        this.server.on('listening', this.getOnListening());
    }

    normalizePort(val) {
        const port = parseInt(val, 10);
        if (isNaN(port)) return val;
        if (port >= 0) return port;
        return false;
    }

    getOnListening() {
        return () => {
            const addr = this.server.address();
            const bind = typeof addr === 'string' ?
                'pipe ' + addr :
                'port ' + addr.port;
            console.log(this.chalk.blue.bgBlack(`[${this.configuration.packageJson.name}] - Listening on ${bind}`));
        };
    }

    getOnError(port) {
        return error => {
            if (error.syscall !== 'listen') throw error;
            const bind = typeof port === 'string' ?
                'Pipe ' + port :
                'Port ' + port;
            switch (error.code) {
                case 'EACCES':
                    console.error(bind + ' requires elevated privileges');
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(bind + ' is already in use');
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        };
    }

}

let server;
try {
    const compositionRoot = new CompositionRoot({ environmentFilename: '.env' });
    compositionRoot.setContainer().registerDependency();
    server = new Server({ compositionRoot });
    server.start();
} catch (err) {
    console.log(err);
}

module.exports = server;