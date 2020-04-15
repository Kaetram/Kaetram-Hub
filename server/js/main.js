let Log = require('./util/log'),
    Utils = require('./util/utils'),
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

        self.guilds = new Guilds(self.api, self.database);

        self.load();
        self.loadConsole();
    }

    load() {
        let self = this;

        self.serversController.onAdd((serverId, info) => {
            let serverName = Utils.formatServerName(serverId);

            log.notice(`Server ${serverId} has been added to the hub.`);

            self.discord.sendRawWebhook(`:white_check_mark: **${serverName} is now online!**`);
        });

        self.serversController.onRemove((serverId, info) => {
            let serverName = Utils.formatServerName(serverId);

            log.error(`Server ${serverId} has been removed from hub for inactivity.`);

            self.discord.sendRawWebhook(`:octagonal_sign: **${serverName} has gone offline!**`)
        });
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

                    console.log(self.api.findEmptyServer());

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
