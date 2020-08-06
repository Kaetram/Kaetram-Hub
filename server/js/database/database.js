/* global module */

let MongoDB = require('./mongodb/mongodb');

class Database {

    constructor() {
        if (!config.databaseEnabled)
            return;

        this.database = null;

        switch(config.database) {
            case 'mongo':
            case 'mongodb':
                this.database = new MongoDB(config.mongoHost, config.mongoPort, config.mongoUser,
                    config.mongoPassword, config.mongoDatabase);
                break;

            default:
                log.error('The database ' + config.database + ' could not be found.');
                break;
        }
    }

    getDatabase() {
        if (!this.database)
            log.error('[Database] No database is currently present. It is advised against proceeding in this state.');

        return this.database;
    }

}

module.exports = Database;
