/* global module */

let MongoClient = require('mongodb').MongoClient,
    Loader = require('./loader'),
    Creator = require('./creator'),
    _ = require('underscore');

class MongoDB {

    constructor(host, port, user, password, database) {
        let self = this;

        self.host = host;
        self.port = port;
        self.user = user;
        self.password = password;
        self.database = database;

        self.loader = new Loader(self);
        self.creator = new Creator(self);

        self.connection = null;

        log.info('Successfully initialized MongoDB.');
    }

    getDatabase(callback) {
        let self = this,
            url = `mongodb://${self.host}:${self.port}/${self.database}`;

            if (config.mongoAuth)
                url = `mongodb://${self.user}:${self.password}@${self.host}:${self.port}/${self.database}`;

            let client = new MongoClient(url, {
                useUnifiedTopology: true,
                useNewUrlParser: true,
                wtimeout: 5
            });

        if (self.connection) {
            callback(self.connection);
            return;
        }

        client.connect((error, newClient) => {
            if (error) {
                log.error('Could not connect to MongoDB database.');
                log.error(`Error Info: ${error}`);
                return;
            }

            self.connection = newClient.db(self.database);

            callback(self.connection);
        });

    }

}

module.exports = MongoDB;
