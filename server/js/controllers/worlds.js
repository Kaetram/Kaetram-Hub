let worldsConfig = require('../../worlds'),
    Request = require('request'),
    _ = require('underscore');

class Worlds {

    constructor() {
        let self = this;

        self.worlds = {};

        self.pingInterval = 5000; // 20 seconds

        self.load();
        self.loadPinger();
    }

    load() {
        let self = this;

        _.each(worldsConfig, (world, key) => {
            self.worlds[key] = {
                gameIp: world.gameIp,
                api: world.api,
                status: 'offline'
            };

            if (world.gamePort)
                self.worlds[key].gamePort = world.gamePort;

            if (world.apiPort)
                self.worlds[key].apiPort = world.apiPort;
        });

        let worldCount = Object.keys(self.worlds).length;

        log.info(`Successfully finished loading ${worldCount} world${worldCount > 1 ? 's' : ''}.`);
    }

    loadPinger() {
        let self = this;

        setInterval(() => {

            _.each(self.worlds, (world) => {

                self.pingWorld(world);

            });

        }, self.pingInterval);

    }

    pingWorld(world) {
        let self = this,
            apiUrl = 'http://' + world.api;

        if (world.apiPort)
            apiUrl += ':' + world.apiPort;

        Request(apiUrl, (error, response, body) => {
            if (error) {
                world.status = 'offline';
                return;
            }

            try {
                world.data = JSON.parse(body);
            } catch (e) {
                world.status = 'offline';
            }

        });

    }

    forEachWorld(callback) {
        _.each(this.worlds, (world) => {
            callback(world);
        })
    }

}

module.exports = Worlds;
