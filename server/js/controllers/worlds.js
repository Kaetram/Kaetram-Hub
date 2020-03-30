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

    }

    addWorld(data) {
        let self = this;

        self.worlds[data.id] = {

        };

    }


    forEachWorld(callback) {
        _.each(this.worlds, (world) => {
            callback(world);
        })
    }

}

module.exports = Worlds;
