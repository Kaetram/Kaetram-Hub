let Log = require('./util/log'),
    Connector = require('./controllers/connector'),
    Worlds = require('./controllers/worlds'),
    API = require('./network/api');

config = require('../config');
log = new Log();

class Main {

    constructor() {
        let self = this;

        self.worldController = new Worlds();
        self.connectorController = new Connector(self.worldController);
        self.apiController = new API(self.worldController);

    }

}

module.exports = Main;

new Main();
