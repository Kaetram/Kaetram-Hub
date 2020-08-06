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
        this.servers = {};

        this.cleanupInterval = null;

        this.load();
    }

    load() {
        this.cleanupInterval = setInterval(() => {

            this.forEachServer((server, key) => {
                let time = new Date().getTime();

                if (time - server.lastPing > config.cleanupThreshold) {

                    if (this.removeServerCallback)
                        this.removeServerCallback(key, this.servers[key]);

                    delete this.servers[key];
                }

            });

        }, config.cleanupTime);
    }

    addServer(data) {
        if (data.serverId in this.servers) {
            this.servers[data.serverId].lastPing = new Date().getTime();
            return;
        }

        this.servers[data.serverId] = {
            host: data.host,
            port: data.port,
            accessToken: data.accessToken,
            lastPing: new Date().getTime(),
            remoteServerHost: data.remoteServerHost
        };

        if (this.addServerCallback)
            this.addServerCallback(data.serverId, this.servers[data.serverId]);
    }

    getServerCount() {
        return Object.keys(this.servers).length;
    }

    forEachServer(callback) {
        _.each(this.servers, (server, key) => {
            callback(server, key);
        })
    }

    onAdd(callback) {
        this.addServerCallback = callback;
    }

    onRemove(callback) {
        this.removeServerCallback = callback;
    }

}

module.exports = Servers;
