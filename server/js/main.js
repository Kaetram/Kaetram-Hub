let Log = require('./util/log'),
    Servers = require('./controllers/servers'),
    Guilds = require('./controllers/guilds'),
    Discord = require('./network/discord'),
    Database = require('./database/database'),
    API = require('./network/api');

config = require('../config');
log = new Log();

class Main {

    constructor() {
        let self = this;

        log.notice(`Initializing ${config.name} engine.`);

        self.serversController = new Servers();
        self.api = new API(self.serversController);
        self.database = new Database().getDatabase();

        self.discord = new Discord(self.api);
        self.api.setDiscord(self.discord);

        self.guilds = new Guilds(self.database);

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

                    self.api.findEmptyServer((response) => {
                        console.log(response);
                    });

                    break;

                case 'player':

                    let username = blocks.join(' ');

                    if (!username) {
                        log.warning('Malformed command - Format: /player [username]');
                        return;
                    }

                    self.api.searchForPlayer(username, (response) => {
                        console.log(response);
                    });

                    break;

            }
        });
    }

}

if ( typeof String.prototype.startsWith !== 'function' ) {
    String.prototype.startsWith = function(str) {
        return str.length > 0 && this.substring( 0, str.length ) === str;
    };
}

if ( typeof String.prototype.endsWith !== 'function' ) {
    String.prototype.endsWith = function(str) {
        return str.length > 0 && this.substring( this.length - str.length, this.length ) === str;
    };
}

module.exports = Main;

new Main();
