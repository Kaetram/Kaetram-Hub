let _ = require('underscore');

class Guilds {

	constructor(api, database) {
		if (!config.guildsEnabled)
			return;

		this.api = api;
		this.database = database;

		this.creator = database.creator;
		this.loader = database.loader;

		/**
		 * A guild contains the following information:
		 * `name` - Identifies the guild
		 * `owner` - Indicates who owns the guild
		 * `players` - An object array containing all the players in the guild.
		 * `playerObject` - Contains `name` and `rank` properties (will be expanded)
		 */

		// Store local guild object array for easier modifications.
		this.guilds = {};

		this.load();
	}

	async load() {
		let guilds = await this.loader.getGuilds();

		_.each(guilds, (guild) => {

			this.guilds[guild.name] = {
				owner: guild.owner,
				players: guild.players
			};

		});

		log.info(`Finished loading ${this.getCount()} guilds.`);
	}

	create(name, owner) {
		if (this.exists(name)) {
			this.api.sendChatToPlayer(owner, 'Could not create a guild with that name.', 'red');
			return;
		}

		this.guilds[name] = {
			owner: owner,
			players: {}
		};

		this.guilds[name].players[owner] = {
			rank: 'owner'
		};

		this.save();
	}

	join(guild, name, rank) {
		let playerGuild = this.findPlayer(name);

		if (playerGuild) {
			this.api.sendChatToPlayer(name, 'You are already in a guild.', 'red');
			return;
		}

		if (name in guild.players) {
			this.api.sendChatToPlayer(name, 'You have already joined this guild.', 'red');
			return;
		}

		guild.players[name] = {
			rank: rank
		};

		this.save();
	}

	updatePlayer(guild, name, data) {
		guild.players[name] = data;
	}

	/**
	 * Removes a player from a guild
	 * `name` - The name of the player
	 */

	leave(name) {
		let guild = this.findPlayer(player);

		if (!guild)
			return;

		delete guild.players[name];

		this.save();
	}

	/**
	 * Finds a player within a guild and returns the guild.
	 */

	findPlayer(name) {
		for (let i in this.guilds)
			if (name in this.guilds[i].players)
				return this.guilds[i];

		return null;
	}

	save() {
		this.forEachGuild((guild) => {

			this.creator.saveGuild(guild);

		});
	}

	/**
	 * Checks if a guild exists.
	 */

	exists(name) {
		for (let i in this.guilds)
			if (this.guilds[i].name.toLowerCase() === name.toLowerCase())
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
