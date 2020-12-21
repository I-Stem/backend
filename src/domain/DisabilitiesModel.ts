import loggerFactory from '../middlewares/WinstonLogger';
import DisabilitiesDbModel from '../models/Disabilities';

class DisabilitiesModel {
    static ServiceName = 'DisabilitiesModel';
    name: string = '';

    persistDisabilities(currUserId: string) {
        const logger = loggerFactory(DisabilitiesModel.ServiceName, 'persistDisabilities');
        new DisabilitiesDbModel(this)
    .save((err: any) => {
        if (err) {
        logger.error(err);
        }
    });
    }
}

export default DisabilitiesModel;
