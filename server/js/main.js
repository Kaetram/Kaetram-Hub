let Log = require('log'),
    Connector = require('./controllers/connector'),
    Worlds = require('./controllers/worlds'),
    config = require('../config');

log = new Log(config.debugLevel, config.localDebug ? fs.createWriteStream('runtime.log') : null);

class Main {

    constructor() {
        let self = this;

        self.worldController = new Worlds();
        self.connectorController = new Connector(self.worldController);

    }

}

module.exports = Main;

new Main();
