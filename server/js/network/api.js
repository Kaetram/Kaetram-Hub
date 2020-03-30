let express = require('express'),
    bodyParser = require('body-parser');

class API {

    /**
     * We use the API format from Kaetram.
     */

    constructor() {
        let self = this;

        let app = express();

        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());

        let router = express.Router();

        self.handle(router);

        app.use('/', router);

        app.listen(config.port, () => {
            log.info(`${config.name} API is now listening on ${config.port}.`);
        });
    }

    handle(router) {
        let self = this;

        router.get('/', (request, response) => {
            response.json({
                status: 'Kaetram Hub is functional.'
            });
        });

        router.post('/', (request, response) => {
            response.json({
                status: 'received'
            });
        });
    }

}

module.exports = API;
