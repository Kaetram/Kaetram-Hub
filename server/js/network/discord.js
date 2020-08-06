let DiscordJS = require('discord.js');

class Discord {

    constructor(api) {
        if (!config.discordEnabled)
            return;

        this.api = api;

        this.client = new DiscordJS.Client();
        this.webhook = new DiscordJS.WebhookClient(config.discordWebhookId, config.discordWebhookToken);

        this.client.on('ready', () => {
            log.notice('Successfully connected to the Discord server.');
        });

        this.client.on('message', (message) => {
            if (message.author.id === config.discordWebhookId)
                return;

            if (message.channel.id !== config.discordServerId)
                return;

            let source = `[Discord | ${message.author.username}]`,
                text = '@goldenrod@' + message.content;

            this.api.broadcastChat(source, text, 'tomato');
        });

        this.client.login(config.discordBotToken);
    }

    /**
     * Sends a message to the Discord server using the webhook.
     */

    sendWebhook(source, text, serverName, withArrow) {
        if (!source || !config.discordEnabled)
            return;

        this.webhook.send(`**[${serverName || 'Kaetram'}]** ${source}${withArrow ? ' »' : ''} ${text}`);
    }

    sendRawWebhook(message) {
        if (!message || !config.discordEnabled || config.debug)
            return;

        this.webhook.send(message);
    }

}

module.exports = Discord;
