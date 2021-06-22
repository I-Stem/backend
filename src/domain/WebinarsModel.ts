import loggerFactory from '../middlewares/WinstonLogger';
import WebinarsDbModel from '../models/Webinars';

class WebinarsModel {
    static ServiceName = 'WebinarsModel';
    resourceTitle: string = '';
    resourceDescription: string = '';
    resourceUrl: string = '';

    constructor(url, name, description) {
        this.resourceUrl = url;
        this.resourceTitle = name;
        this.resourceDescription = description;
    }

    async persistWebinars() {
                const logger = loggerFactory(WebinarsModel.ServiceName, 'persistWebinars');
        await new WebinarsDbModel(this)
    .save();
    }
}

export default WebinarsModel;
