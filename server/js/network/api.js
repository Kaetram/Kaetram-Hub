let express = require('express'),
    request = require('request'),
    bodyParser = require('body-parser'),
    APIConstants = require('../util/apiconstants');

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

    async getPlayer(playerName, server) {
        let self = this,
            url = self.getUrl(server, 'player'),
            data = {
                form: {
                    token: server.accessToken,
                    playerName: playerName
                }
            };

        return new Promise((resolve) => {

            request.post(url, data, (error, response, body) => {

                try {
                    resolve(body);
                } catch(e) {
                    log.error('An error has occurred while getting player.');
                    resolve({ error: '`getPlayer`: An error has occurred.'});
                }

            });
        });

    }

    async searchForPlayer(playerName, callback) {
        let self = this,
            serverList = self.serversController.servers;

        for (let key in serverList) {
            let server = serverList[key],
                result = await self.getPlayer(playerName, server);

            callback(result);
        }

    }

    getUrl(server, path) {
        return `http://${server.host}:${server.port}/${path}`;
    }

}

module.exports = API;
