/* global module */

class Loader {

    constructor(database) {
        this.database = database;
    }

    async getGuilds(returnCollection) {
        return new Promise((resolve, _reject) => {
            this.database.getDatabase((database) => {
                let guilds = database.collection('guild_data'),
                    cursor = guilds.find();

                cursor.toArray().then((guildsList) => {
                    resolve(guildsList, returnCollection ? guilds : null);
                });
            });
        });

    }

    async getGuild(name, callback) {
        this.database.getDatabase((database) => {
            let guilds = database.collection('guild_data'),
                cursor = guilds.find({ name: name.toLowerCase() });

            cursor.toArray().then((guildsArray) => {
                let info = guildsArray[0];

                if (!info) {
                    callback(null);
                    return;
                }

                if (info.name !== name)
                    log.notice('[Loader] Mismatch whilst retrieving guild data for ' + name);

                callback({
                    name: info.name,
                    owner: info.owner,
                    players: info.players
                });

            });
        });
    }

    guildExists(name, callback) {
        this.database.getDatabase((database) => {
            let guilds = database.collection('guild_data'),
                cursor = guilds.find({ name: name.toLowerCase() });

            cursor.toArray().then((data) => {
                callback(data.length === 0);
            });
        });
    }

}

module.exports = Loader;
