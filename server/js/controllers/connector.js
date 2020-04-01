class Connector {

    constructor(serversController) {
        let self = this;

        self.serversController = serversController;
    }

    findServer(callback) {
        let self = this;

        self.serversController.forEachServer((server) => {

        });
    }

}

module.exports = Connector;
