/* global module */

class Creator {

    constructor(database) {
        this.database = database;
    }

    saveGuild(guild) {
        let self = this,
            data = {
                name: guild.name, // Actual name
                owner: guild.owner,
                players: guild.players
            };

        if (!data.name || !data.owner || !data.players)
            return;

        self.database.getDatabase((database) => {
            let guilds = database.collection('guild_data');

            guilds.updateOne({
                name: guild.name.toLowerCase()
            }, { $set: data }, {
                upsert: true
            }, (error, result) => {
                if (error)
                    throw error;

                if (result)
                    log.debug(`Successfully saved data for ${guild.name}'s guild.`)
            });
        });

    }


}

module.exports = Creator;
