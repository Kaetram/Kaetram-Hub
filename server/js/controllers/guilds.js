let _ = require('underscore');

class Guilds {

	constructor(api, database) {
		let self = this;

		if (!config.guildsEnabled)
			return;

		self.api = api;
		self.database = database;

		self.creator = database.creator;
		self.loader = database.loader;

		/**
		 * A guild contains the following information:
		 * `name` - Identifies the guild
		 * `owner` - Indicates who owns the guild
		 * `players` - An object array containing all the players in the guild.
		 * `playerObject` - Contains `name` and `rank` properties (will be expanded)
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

		log.info(`Finished loading ${self.getCount()} guilds.`);
	}

	create(name, owner) {
		let self = this;

		if (self.exists(name)) {
			self.api.sendChatToPlayer(owner, 'Could not create a guild with that name.', 'red');
			return;
		}

		self.guilds[name] = {
			owner: owner,
			players: {}
		};

		self.guilds[name].players[owner] = {
			rank: 'owner'
		};

		self.save();
	}

	join(guild, name, rank) {
		let self = this,
			playerGuild = self.findPlayer(name);

		if (playerGuild) {
			self.api.sendChatToPlayer(name, 'You are already in a guild.', 'red');
			return;
		}

		if (name in guild.players) {
			self.api.sendChatToPlayer(name, 'You have already joined this guild.', 'red');
			return;
		}

		guild.players[name] = {
			rank: rank
		};

		self.save();
	}

	updatePlayer(guild, name, data) {
		guild.players[name] = data;
	}

	/**
	 * Removes a player from a guild
	 * `name` - The name of the player
	 */

	leave(name) {
		let self = this,
			guild = self.findPlayer(player);

		if (!guild)
			return;

		delete guild.players[name];

		self.save();
	}

	/**
	 * Finds a player within a guild and returns the guild.
	 */

	findPlayer(name) {
		let self = this;

		for (let i in self.guilds)
			if (name in self.guilds[i].players)
				return self.guilds[i];

		return null;
	}

	save() {
		let self = this;

		self.forEachGuild((guild) => {

			self.creator.saveGuild(guild);

		});
	}

	/**
	 * Checks if a guild exists.
	 */

	exists(name) {
		let self = this;

		for (let i in self.guilds)
			if (self.guilds[i].name.toLowerCase() === name.toLowerCase())
				return true;

		return false;
	}

	getCount() {
		return Object.keys(this.guilds).length;
	}

	forEachGuild(callback) {
		_.each(this.guilds, (guild) => { callback(guild); });
	}

}

module.exports = Guilds;
