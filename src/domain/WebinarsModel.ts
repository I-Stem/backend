import loggerFactory from '../middlewares/WinstonLogger';
import WebinarsDbModel from '../models/Webinars';

class WebinarsModel {
    static ServiceName = 'WebinarsModel';
    resourceTitle: string = '';
    resourceDescription: string = '';
    resourceUrl: string = '';

    persistWebinars(currUserId: string) {
        const logger = loggerFactory(WebinarsModel.ServiceName, 'persistWebinars');
        new WebinarsDbModel(this)
    .save((err: any) => {
        if (err) {
        logger.error(err);
        }
    });
    }
}

export default WebinarsModel;
