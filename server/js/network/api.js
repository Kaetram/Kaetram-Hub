let express = require('express'),
    request = require('request'),
    bodyParser = require('body-parser');

class API {

    /**
     * We use the API format from Kaetram.
     */

    constructor(serversController) {
        let self = this;

        self.serversController = serversController;

        let app = express();

        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());

        let router = express.Router();

        self.handle(router);

        app.use('/', router);

        app.listen(config.port, () => {
            log.info(`${config.name} API is now listening on ${config.port}.`);
        });
    }

    handle(router) {
        let self = this;

        router.get('/', (request, response) => {
            response.json({
                status: 'Kaetram Hub is functional.'
            });
        });

        router.post('/ping', (request, response) => {
            if (!request.body) {
                response.json({ status: 'error' });
                return;
            }

            let mappedAddress = request.connection.remoteAddress,
                address = mappedAddress.split('::ffff:')[1];

            request.body.address = address;

            self.serversController.addServer(request.body);

            response.json({
                status: 'success'
            });
        });
    }

    getPlayer(playerName, callback, server) {
        let self = this;

        if (server) {
            let url = self.getUrl(server, 'player'),
                data = {
                    form: {
                        token: server.accessToken
                    }
                }

            request.post(url, data, (error, response, body) => {

                try {
                    let data = JSON.parse(body);

                    console.log(data);
                } catch(e) {
                    log.error('An error has occurred while getting player.');
                }

            });

            return;
        }
    }

    searchForPlayer(playerName, callback) {
        let self = this;

        self.serversController.forEachServer((server) => {
            let url = self.getUrl(server, 'player');

            request.post(url, {}, (error, response, body) => {

                try {
                    let data = JSON.parse(body);

                    console.log(data);
                } catch(e) {}

            });
        });
    }

    getUrl(server, path) {
        return `http://${server.address}:${server.port}/${path}`;
    }

}

module.exports = API;
