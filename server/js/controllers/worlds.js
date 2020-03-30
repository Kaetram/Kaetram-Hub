let Request = require('request'),
    _ = require('underscore');

class Worlds {

    /**
     * We keep track of the worlds that are connected to the hub.
     * When a server goes online, it pings the hub (if hub config is enabled)
     * and it will ping the hub at a set interval. We keep track of those
     * pings here. If a world does not ping for a certain period of time,
     * we just remove it to preserve resources.
     */

    constructor() {
        let self = this;

        self.worlds = {};

        self.cleanupThreshold = 60000;//600000; // Clean up after 10 minutes
        self.cleanupTime = 30000; // Update every 60 seconds.
        self.cleanupInterval = null;

        self.load();
    }

    load() {
        let self = this;

        self.cleanupInterval = setInterval(() => {

            self.forEachWorld((world, key) => {
                let time = new Date().getTime();

                if (time - world.lastPing > self.cleanupThreshold)
                    delete self.worlds[key];

            });

        }, self.cleanupTime);
    }

    addWorld(data) {
        let self = this;

        if (data.serverId in self.worlds) {
            self.worlds[data.serverId].lastPing = new Date().getTime();
            return;
        }

        self.worlds[data.serverId] = {
            accessToken: data.accessToken,
            lastPing: new Date().getTime()
        };

    }

    forEachWorld(callback) {
        _.each(this.worlds, (world, key) => {
            callback(world, key);
        })
    }

}

module.exports = Worlds;
