import loggerFactory from '../middlewares/WinstonLogger';
import SkillsDbModel from '../models/Skills';

class SkillsModel {
    static ServiceName = 'SkillsModel';
    name: string = '';

    persistSkills(currUserId: string) {
        const logger = loggerFactory(SkillsModel.ServiceName, 'persistSkills');
        new SkillsDbModel(this)
    .save((err: any) => {
        if (err) {
        logger.error(err);
        }
    });
    }
}

export default SkillsModel;
