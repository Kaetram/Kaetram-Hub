let _ = require('underscore');

class Guilds {

	constructor(api, database) {
		let self = this;

		self.api = api;
		self.database = database;

		self.creator = database.creator;
		self.loader = database.loader;

		/**
		 * A guild contains the following information:
		 * `name` - Identifies the guild
		 * `owner` - Indicates who owns the guild
		 * `players` - An array containing all the players in the guild.
		 */

		// Store local guild object array for easier modifications.
		self.guilds = {};

		self.load();
	}

	async load() {
		let self = this,
			guilds = await self.loader.getGuilds();

		_.each(guilds, (guild) => {

			self.guilds[guild.name] = {
				owner: guild.owner,
				players: guild.players
			};

		});
	}

	create(name, owner) {
		let self = this;

		if (self.exists(name)) {
			self.api.sendChatToPlayer(owner, 'Could not create a guild with that name.', 'red');
			return;
		}

		self.guilds[name] = {
			owner: owner,
			players: [owner]
		};

		self.save();
	}

	join(guild, player) {
		let self = this,
			playerGuild = self.findPlayer(player);

		if (playerGuild) {
			self.api.sendChatToPlayer(player, 'You are already in a guild.', 'red');
			return;
		}

		guild.players.push(player);

		self.save();
	}

	/**
	 * `player` - The name of the player
	 */

	leave(player) {
		let self = this,
			guild = self.findPlayer(player);

		if (!guild)
			return;

		let index = guild.indexOf(player);

		guild.players.splice(index, 1);

		self.save();
	}

	/**
	 * Finds a player within a guild and returns that.
	 */

	findPlayer(player) {
		let self = this;

		for (let i in self.guilds)
			if (self.guilds[i].members.indexOf(player) > -1)
				return self.guilds[i];

		return null;
	}

	save() {
		let self = this;

		self.forEachGuild((guild) => {

			self.creator.saveGuild(guild);

		});
	}

	exists(name) {
		let self = this;

		for (let i in self.guilds)
			if (self.guilds[i].name.toLowerCase() === name.toLowerCase())
				return true;

		return false;
	}

	forEachGuild(callback) {
		_.each(this.guilds, (guild) => { callback(guild); });
	}

}

module.exports = Guilds;
