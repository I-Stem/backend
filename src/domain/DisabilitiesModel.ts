import loggerFactory from '../middlewares/WinstonLogger';
import DisabilitiesDbModel from '../models/Disabilities';

class DisabilitiesModel {
    static ServiceName = 'DisabilitiesModel';
    name: string = '';

    constructor(name: string) {
        this.name = name;
    }

    async persistDisabilities() {
        const logger = loggerFactory(DisabilitiesModel.ServiceName, 'persistDisabilities');
        await new DisabilitiesDbModel(this)
    .save();
    }
}

export default DisabilitiesModel;
