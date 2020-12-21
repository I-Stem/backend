/**
 * Define Industry api
 *
 */
import { Request, Response } from 'express';
import { createResponse, response } from '../../utils/response';
import * as HttpStatus from 'http-status-codes';
import Industry from '../../models/Industry';
import loggerFactory from '../../middlewares/WinstonLogger';
import IndustryModel from '../../domain/IndustryModel';
import {plainToClass} from 'class-transformer';

class IndustryController {
    static ServiceName = 'Industry Controller';
    public static getIndustry(req: Request, res: Response) {
        const logger = loggerFactory(IndustryController.ServiceName, 'getIndustry');
        Industry.find().exec().then((results) => {
            return res.status(HttpStatus.OK).json(
                response[HttpStatus.OK]({
                    message: `List for industry`,
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
}
export default IndustryController;
