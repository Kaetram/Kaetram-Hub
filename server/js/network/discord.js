let DiscordJS = require('discord.js');

class Discord {

    constructor(api) {
        let self = this;

        if (!config.discordEnabled)
            return;

        self.api = api;

        self.client = new DiscordJS.Client();
        self.webhook = new DiscordJS.WebhookClient(config.discordWebhookId, config.discordWebhookToken);

        self.client.on('ready', () => {
            log.notice('Successfully connected to the Discord server.');
        });

        self.client.on('message', (message) => {
            if (message.author.id === config.discordWebhookId)
                return;

            if (message.channel.id !== config.discordServerId)
                return;

            let source = `[Discord | ${message.author.username}]`,
                text = '@goldenrod@' + message.content;

            self.api.broadcastChat(source, text, 'tomato');
        });

        self.client.login(config.discordBotToken);
    }

    /**
     * Sends a message to the Discord server using the webhook.
     */

    sendWebhook(source, text, serverName, withArrow) {
        let self = this;

        if (!source || !config.discordEnabled)
            return;

        self.webhook.send(`**[${serverName || 'Kaetram'}]** ${source}${withArrow ? ' »' : ''} ${text}`);
    }

    sendRawWebhook(message) {
        let self = this;

        if (!message || !config.discordEnabled || config.debug)
            return;

        self.webhook.send(message);
    }

}

module.exports = Discord;
