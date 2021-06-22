import loggerFactory from '../middlewares/WinstonLogger';
import IndustryDbModel from '../models/Industry';

class IndustryModel {
    static ServiceName = 'IndustryModel';
    name: string = '';

    constructor(name:string) {
        this.name = name;
    }

    async persistIndustry() {
        const logger = loggerFactory(IndustryModel.ServiceName, 'persistIndustry');
        await new IndustryDbModel(this)
    .save();
    }
}

export default IndustryModel;
