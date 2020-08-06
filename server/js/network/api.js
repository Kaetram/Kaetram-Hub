let express = require('express'),
    request = require('request'),
    bodyParser = require('body-parser'),
    Utils = require('../util/utils');
    
class API {

    /**
     * We use the API format from Kaetram.
     */

    constructor(serversController) {
        this.serversController = serversController;

        let app = express();

        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());

        let router = express.Router();

        this.handle(router);

        app.use('/', router);

        app.listen(config.port, () => {
            log.info(`${config.name} API is now listening on ${config.port}.`);
        });
    }

    handle(router) {
        router.get('/', (_request, response) => {
            response.json({
                status: 'Kaetram Hub is functional.'
            });
        });

        router.get('/server', (_request, response) => {
            this.findEmptyServer((result) => {
                this.setHeaders(response);

                response.json(result);
            });
        });

        router.get('/all', (_request, response) => {
            this.getServers((data) => {
                this.setHeaders(response);

                response.json(data);
            });
        });

        router.post('/ping', (request, response) => {
            this.handlePing(request, response);
        });

        router.post('/chat', (request, response) => {
            this.handleChat(request, response);
        });

        router.post('/privateMessage', (request, response) => {
            this.handlePrivateMessage(request, response);
        });
    }

    handlePing(request, response) {
        if (!request.body) {
            response.json({ status: 'error' });
            return;
        }

        let mappedAddress = request.connection.remoteAddress,
            host = mappedAddress.split('::ffff:')[1];

        // This is the host we use to connect the hub to the server API.
        request.body.host = host;

        this.serversController.addServer(request.body);

        response.json({
            status: 'success'
        });
    }

    handleChat(request, response) {
        if (!request.body) {
            response.json({ status: 'error' });
            return;
        }

        if (!this.verifyToken(request.body.hubAccessToken)) {
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
            withArrow = request.body.withArrow,
            serverName = Utils.formatServerName(serverId);

        this.discord.sendWebhook(source, text, serverName, withArrow);

        response.json({ status: 'success' });
    }

    handlePrivateMessage(request, response) {
        if (!request.body) {
            response.json({ status: 'error' });
            return;
        }

        if (!this.verifyToken(request.body.hubAccessToken)) {
            response.json({
                status: 'error',
                reason: 'Invalid `hubAccessToken` specified.'
            });

            return;
        }

        let source = request.body.source, // From who we are receiving the text
            target = request.body.target, // Who we're sending the text to
            text = request.body.text; // The text

        this.searchForPlayer(target, (result) => {
            if (result.error) {
                response.json({ error: 'Player could not be found.' });
                return;
            }

            let server = this.serversController.servers[result.serverId];

            source = `[From ${source}]`;

            this.sendChat(server, result.serverId, source, text, 'aquamarine', target);
        });
    }

    sendChat(server, key, source, text, colour, username) {
        let url = this.getUrl(server, 'chat'),
            data = {
                form: {
                    accessToken: server.accessToken,
                    text: text,
                    source: source,
                    colour: colour,
                    username: username
                }
            };

        request.post(url, data, (error, _response, body) => {
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

    sendChatToPlayer(player, text, colour) {
        this.searchForPlayer(player, (server, key) => {
            if (!server) {
                log.error(`Could not find ${player}.`);
                return;
            }

            this.sendChat(server, key, player, text, colour);

        }, true);
    }

    async getServer(server) {
        let url = this.getUrl(server, '');

        return new Promise((resolve, reject) => {
            request(url, (error, _response, body) => {
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
        let url = this.getUrl(server, 'player'),
            data = {
                form: {
                    accessToken: server.accessToken,
                    username: username
                }
            };

        return new Promise((resolve, reject) => {

            request.post(url, data, (error, _response, body) => {

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
        this.serversController.forEachServer((server, key) => {
            this.sendChat(server, key, source, text, colour);
        });
    }

    async searchForPlayer(username, callback, returnServer) {
        let serverList = this.serversController.servers;

        for (let key in serverList) {
            let server = serverList[key];

            try {
                let result = await this.getPlayer(username, server);

                if (returnServer)
                    callback(server, key);
                else
                    callback(result);

                return;

            } catch (e) {}
        }

        callback({ error: 'Could not find player in any of the worlds.' });
    }

    async findEmptyServer(callback) {
        let serverList = this.serversController.servers;

        for (let key in serverList) {
            let server = serverList[key];

            try {
                let result = await this.getServer(server);

                callback(result);

                return;
            } catch (e) {

                console.log(e);
            }

        }

        callback({ error: 'All servers are full.' });
    }

    async getServers(callback) {
        let serverList = this.serversController.servers,
            serverData = [];

        for (let key in serverList) {
            let server = serverList[key];

            try {
                let result = await this.getServer(server);

                serverData.push({
                    serverId: key,
                    host: result.host,
                    port: result.port,
                    gameVersion: result.gameVersion,
                    playerCount: result.playerCount,
                    maxPlayers: result.maxPlayers
                })

            } catch (e) {
                console.log(e);
            }
        }

        callback(serverData);
    }

    verifyToken(hubAccessToken) {
        return hubAccessToken === config.hubAccessToken;
    }

    getUrl(server, path) {
        return `http://${server.host}:${server.port}/${path}`;
    }

    setDiscord(discord) {
        if (!this.discord)
            this.discord = discord;
    }

    setHeaders(response) {
        response.header("Access-Control-Allow-Origin", "*");
        response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }

}

module.exports = API;
