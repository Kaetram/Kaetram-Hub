let Request = require('request'),
    _ = require('underscore');

class Servers {

    /**
     * We keep track of the servers that are connected to the hub.
     * When a server goes online, it pings the hub (if hub config is enabled)
     * and it will ping the hub at a set interval. We keep track of those
     * pings here. If a server does not ping for a certain period of time,
     * we just remove it to preserve resources.
     */

    constructor() {
        let self = this;

        self.servers = {};

        self.cleanupThreshold = 600000; // Clean up after 10 minutes
        self.cleanupTime = 60000; // Update every 60 seconds.
        self.cleanupInterval = null;

        self.load();
    }

    load() {
        let self = this;

        self.cleanupInterval = setInterval(() => {

            self.forEachServer((server, key) => {
                let time = new Date().getTime();

                if (time - server.lastPing > self.cleanupThreshold)
                    delete self.servers[key];

            });

        }, self.cleanupTime);
    }

    addServer(data) {
        let self = this;

        if (data.serverId in self.servers) {
            self.servers[data.serverId].lastPing = new Date().getTime();
            return;
        }

        self.servers[data.serverId] = {
            host: data.address,
            port: data.port,
            accessToken: data.accessToken,
            lastPing: new Date().getTime()
        };

    }

    forEachServer(callback) {
        _.each(this.servers, (server, key) => {
            callback(server, key);
        })
    }

}

module.exports = Servers;
