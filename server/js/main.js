let Log = require('./util/log'),
    Servers = require('./controllers/servers'),
    Discord = require('./network/discord'),
    API = require('./network/api');

config = require('../config');
log = new Log();

class Main {

    constructor() {
        let self = this;

        self.serversController = new Servers();

        self.api = new API(self.serversController);
        self.discord = new Discord(self.api);

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

                case 'server':

                    self.apiController.findEmptyServer((response) => {
                        console.log(response);
                    });

                    break;

                case 'player':

                    let username = blocks.join(' ');

                    if (!username) {
                        log.warning('Malformed command - Format: /player [username]');
                        return;
                    }

                    self.apiController.searchForPlayer(username, (response) => {
                        console.log(response);
                    });

                    break;

            }
        });
    }

}

module.exports = Main;

new Main();
