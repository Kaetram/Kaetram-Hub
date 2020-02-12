let worldsConfig = require('../../worlds'),
    Request = require('request'),
    _ = require('underscore');

class Worlds {

    constructor() {
        let self = this;

        self.worlds = {};

        self.pingInterval = 20000; // 20 seconds

        self.load();
        self.loadPinger();
    }

    load() {
        let self = this;

        _.each(worldsConfig, (world, key) => {
            self.worlds[key] = {
                ip: world.ip,
                gamePort: parseInt(world.gamePort),
                apiPort: parseInt(world.apiPort),
                status: 'offline'
            };
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
        });

    }

    pingWorld(world) {
        let self = this;

        
    }


}

module.exports = Worlds;
