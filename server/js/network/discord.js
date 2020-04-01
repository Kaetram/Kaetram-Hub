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

            self.api.sendChat(source, text, 'tomato');
        });

        self.client.login(config.discordBotToken);
    }

    /**
     * Sends a message to the Discord server using the webhook.
     */

    sendMessage(playerName, message) {
        let self = this;

        if (!playerName || !config.discordEnabled)
            return;

        let formattedUsername = Utils.formatUsername(player.username);

        self.webhook.send(`**[Kaetram]** ${formattedUsername} » ${message}`)
    }

}

module.exports = Discord;
