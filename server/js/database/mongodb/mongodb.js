/* global module */

let MongoClient = require('mongodb').MongoClient,
    Loader = require('./loader'),
    Creator = require('./creator');
    
class MongoDB {

    constructor(host, port, user, password, database) {
        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.database = database;

        this.loader = new Loader(this);
        this.creator = new Creator(this);

        this.connection = null;

        log.info('Successfully initialized MongoDB.');
    }

    getDatabase(callback) {
        let url = `mongodb://${this.host}:${this.port}/${this.database}`;

            if (config.mongoAuth)
                url = `mongodb://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`;

            let client = new MongoClient(url, {
                useUnifiedTopology: true,
                useNewUrlParser: true,
                wtimeout: 5
            });

        if (this.connection) {
            callback(this.connection);
            return;
        }

        client.connect((error, newClient) => {
            if (error) {
                log.error('Could not connect to MongoDB database.');
                log.error(`Error Info: ${error}`);
                return;
            }

            this.connection = newClient.db(this.database);

            callback(this.connection);
        });

    }

}

module.exports = MongoDB;
