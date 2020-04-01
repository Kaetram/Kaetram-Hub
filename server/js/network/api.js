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

    sendChat(source, text, colour) {
        let self = this;

        self.serversController.forEachServer((server, key) => {
            let url = self.getUrl(server, 'chat'),
                data = {
                    form: {
                        token: server.accessToken,
                        message: text,
                        source: source,
                        colour: colour
                    }
                };

            request.post(url, data, (error, response, body) => {
                if (error) {
                    log.error(`Could not send chat to ${key}`);
                    return;
                }

                try {

                    let data = JSON.parse(body);

                    if (data.error)
                        log.error(`An error has occurred while sending chat: ${data.error}`);

                } catch (e) {
                    log.error('`getChat` could not parse the response.');
                }

            });
        })
    }

    async getServer(server) {
        let self = this,
            url = self.getUrl(server, '');

        return new Promise((resolve, reject) => {
            request(url, (error, response, body) => {
                if (error) {
                    log.error('Could not connect to server.');
                    reject({ error: '`getServer`: An error occurred.' });

                    return;
                }

                try {

                    let data = JSON.parse(body);

                    if (data.playerCount < data.maxPlayers)
                        resolve(data);
                    else
                        reject({ error: 'World is full' });

                } catch (e) {
                    reject({ error: '`getServer` could not parse the response.' });
                }

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

        return new Promise((resolve, reject) => {

            request.post(url, data, (error, response, body) => {

                if (error) {
                    log.error('An error has occurred while getting player.');
                    reject({ error: '`getPlayer`: An error has occurred.' });

                    return;
                }

                try {

                    let data = JSON.parse(body);

                    data.error ? reject(data) : resolve(data);

                } catch (e) {
                    reject({ error: '`getPlayer` could not parse the response.' });
                }

            });
        });

    }

    async searchForPlayer(playerName, callback) {
        let self = this,
            serverList = self.serversController.servers;

        for (let key in serverList) {
            let server = serverList[key];

            try {
                let result = await self.getPlayer(playerName, server);

                callback(result);

                return;

            } catch (e) {}
        }

        callback({ error: 'Could not find player in any of the worlds.' });
    }

    async findEmptyServer(callback) {
        let self = this,
            serverList = self.serversController.servers;

        for (let key in serverList) {
            let server = serverList[key];

            try {
                let result = await self.getServer(server);

                callback(result);

                return;
            } catch (e) {}

        }

        callback({ error: 'All servers are full.' });
    }

    getUrl(server, path) {
        return `http://${server.host}:${server.port}/${path}`;
    }

}

module.exports = API;
