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

        router.get('/server', (request, response) => {
            self.findEmptyServer((result) => {
                response.header("Access-Control-Allow-Origin", "*");
                response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

                log.debug('Finding server for.. someone..');

                response.json(result);
            });
        });

        router.post('/ping', (request, response) => {
            self.handlePing(request, response);
        });

        router.post('/chat', (request, response) => {
            self.handleChat(request, response);
        });

        router.post('/privateMessage', (request, response) => {
            self.handlePrivateMessage(request, response);
        });
    }

    handlePing(request, response) {
        let self = this;

        if (!request.body) {
            response.json({ status: 'error' });
            return;
        }

        let mappedAddress = request.connection.remoteAddress,
            host = mappedAddress.split('::ffff:')[1];

        // This is the host we use to connect the hub to the server API.
        request.body.host = host;

        self.serversController.addServer(request.body);

        response.json({
            status: 'success'
        });
    }

    handleChat(request, response) {
        let self = this;

        if (!request.body) {
            response.json({ status: 'error' });
            return;
        }

        if (!self.verifyToken(request.body.hubAccessToken)) {
            response.json({
                status: 'error',
                reason: 'Invalid `hubAccessToken` specified.'
            });

            return;
        }

        let serverId = request.body.serverId;

        if (!serverId) {
            response.json({
                status: 'error',
                reason: 'No `serverId` has been specified.'
            });

            return;
        }

        let source = request.body.source,
            text = request.body.text,
            serverName;

        // TODO - Make this less hard-coded.
        if (serverId.startsWith('kaetram_server')) {
            let serverNumber = parseInt(serverId.split('kaetram_server')[1]);

            serverName = `Kaetram ${serverNumber}`;
        }

        self.discord.sendWebhook(source, text, serverName);

        response.json({ status: 'success' });
    }

    handlePrivateMessage(request, response) {
        let self = this;

        if (!request.body) {
            response.json({ status: 'error' });
            return;
        }

        if (!self.verifyToken(request.body.hubAccessToken)) {
            response.json({
                status: 'error',
                reason: 'Invalid `hubAccessToken` specified.'
            });

            return;
        }

        let source = request.body.source, // From who we are receiving the text
            target = request.body.target, // Who we're sending the text to
            text = request.body.text; // The text

        self.searchForPlayer(target, (result) => {
            if (result.error) {
                response.json({ error: 'Player could not be found.' });
                return;
            }

            let server = self.serversController.servers[result.serverId];

            source = `[From ${source}]`;

            self.sendChat(server, result.serverId, source, text, 'aquamarine', target);
        });
    }

    sendChat(server, key, source, text, colour, username) {
        let self = this,
            url = self.getUrl(server, 'chat'),
            data = {
                form: {
                    accessToken: server.accessToken,
                    text: text,
                    source: source,
                    colour: colour,
                    username: username
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

                    data.host = server.remoteServerHost || server.host;

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

    async getPlayer(username, server) {
        let self = this,
            url = self.getUrl(server, 'player'),
            data = {
                form: {
                    accessToken: server.accessToken,
                    username: username
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

    broadcastChat(source, text, colour) {
        let self = this;

        self.serversController.forEachServer((server, key) => {
            self.sendChat(server, key, source, text, colour);
        });
    }

    async searchForPlayer(username, callback) {
        let self = this,
            serverList = self.serversController.servers;

        for (let key in serverList) {
            let server = serverList[key];

            try {
                let result = await self.getPlayer(username, server);

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
            } catch (e) {

                console.log(e);
            }

        }

        callback({ error: 'All servers are full.' });
    }

    verifyToken(hubAccessToken) {
        return hubAccessToken === config.hubAccessToken;
    }

    getUrl(server, path) {
        return `http://${server.host}:${server.port}/${path}`;
    }

    setDiscord(discord) {
        let self = this;

        if (!self.discord)
            self.discord = discord;
    }

}

module.exports = API;
