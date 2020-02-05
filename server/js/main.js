let Log = require('log'),
    config = require('../config');

log = new Log(config.debugLevel, config.localDebug ? fs.createWriteStream('runtime.log') : null);

class Main {

    constructor() {
        let self = this;

        log.info('hello');
    }

}

module.exports = Main;

new Main();
