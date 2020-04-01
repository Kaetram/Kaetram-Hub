let Log = require('./util/log'),
    Connector = require('./controllers/connector'),
    Servers = require('./controllers/servers'),
    API = require('./network/api');

config = require('../config');
log = new Log();

class Main {

    constructor() {
        let self = this;

        self.serversController = new Servers();
        self.connectorController = new Connector(self.serversController);
        self.apiController = new API(self.serversController);


        self.loadConsole();
    }

    loadConsole() {
        let self = this,
            stdin = process.openStdin();

        stdin.addListener('data', (data) => {
            let message = data.toString().replace(/(\r\n|\n|\r)/gm, ''),
                type = message.charAt(0);

            if (type !== '/')
                return;

            let blocks = message.substring(1).split(' '),
                command = blocks.shift();

            if (!command)
                return;

            switch (command) {

                case 'player':

                    let username = blocks.join(' ');

                    if (!username) {
                        log.warning('Malformed command - Format: /player [username]');
                        return;
                    }

                    self.apiController.getPlayer(username, (response) => {
                        console.log(response);
                    }, {
                        address: '127.0.0.1',
                        port: 9002,
                        accessToken: 'lol'
                    });

                    break;

            }
        });
    }

}

module.exports = Main;

new Main();
