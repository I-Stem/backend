/**
 * Define Skills api
 *
 */
import { Request, Response } from 'express';
import { createResponse, response } from '../../utils/response';
import * as HttpStatus from 'http-status-codes';
import Skills from '../../models/Skills';
import loggerFactory from '../../middlewares/WinstonLogger';
import SkillsModel from '../../domain/SkillsModel';
import {plainToClass} from 'class-transformer';

class SkillsController {
    static ServiceName = 'Skills Controller';
    public static getSkills(req: Request, res: Response) {
        const logger = loggerFactory(SkillsController.ServiceName, 'getSkills');
        Skills.find().exec().then((results) => {
            return res.status(HttpStatus.OK).json(
                response[HttpStatus.OK]({
                    message: `List for Skills`,
                    data: results
                }));
        }).catch((err: any) => {
            console.log(err);
            logger.error(`Internal error occurred while getting Disabiities results. ${err}`);
            return res.status(HttpStatus.BAD_GATEWAY).json(
                response[HttpStatus.BAD_GATEWAY]({
                    message: `An internal server error occured ${err}`
                })
            );
        });

    }
    public static addSkills(req: Request, res: Response) {
        const logger = loggerFactory(SkillsController.ServiceName, 'addMentorship');
        logger.info('Request Received: %o', req.body);
        const skillsInstance = plainToClass(SkillsModel, req.body);
        skillsInstance.persistSkills(res.locals.user.id);
        return res.status(HttpStatus.OK).json(
            response[HttpStatus.OK]({
                message: `skills successfully stored`,
                data: req.body
            }));
    }
}
export default SkillsController;
