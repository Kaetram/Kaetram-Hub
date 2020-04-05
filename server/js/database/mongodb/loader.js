/* global module */

class Loader {

    constructor(database) {
        this.database = database;
    }

    getGuilds(callback, returnCollection) {
        let self = this;

        self.database.getDatabase((database) => {
            let guilds = database.collection('guild_data'),
                cursor = guilds.find();

            cursor.toArray().then((guildsList) => {
                callback(guildsList, returnCollection ? guilds : null);
            });
        });
    }

    getGuild(name, callback) {
        let self = this;

        self.database.getDatabase((database) => {
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
                    members: info.members
                });

            });
        });
    }

    guildExists(name, callback) {
        let self = this;

        self.database.getDatabase((database) => {
            let guilds = database.collection('guild_data'),
                cursor = guilds.find({ name: name.toLowerCase() });

            cursor.toArray().then((data) => {
                callback(data.length === 0);
            });
        });
    }

}

module.exports = Loader;
