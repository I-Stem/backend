import loggerFactory from '../middlewares/WinstonLogger';
import IndustryDbModel from '../models/Industry';

class IndustryModel {
    static ServiceName = 'IndustryModel';
    name: string = '';

    persistIndustry(currUserId: string) {
        const logger = loggerFactory(IndustryModel.ServiceName, 'persistIndustry');
        new IndustryDbModel(this)
    .save((err: any) => {
        if (err) {
        logger.error(err);
        }
    });
    }
}

export default IndustryModel;
