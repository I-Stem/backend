import loggerFactory from '../middlewares/WinstonLogger';
import SkillsDbModel from '../models/Skills';

class SkillsModel {
    static ServiceName = 'SkillsModel';
    name: string = '';

    constructor(name:string) {
        this.name = name;
    }

    async persistSkills() {
        const logger = loggerFactory(SkillsModel.ServiceName, 'persistSkills');
        await new SkillsDbModel(this)
    .save();
    }
}

export default SkillsModel;
