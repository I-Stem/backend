/**
 * Define Disabilities api
 *
 */
import { Request, Response } from 'express';
import { createResponse, response } from '../../utils/response';
import * as HttpStatus from 'http-status-codes';
import Disabilities from '../../models/Disabilities';
import loggerFactory from '../../middlewares/WinstonLogger';

class DisabilitiesController {
    static ServiceName = 'Disabilities Controller';
    public static getDisabilities(req: Request, res: Response) {
        const logger = loggerFactory(DisabilitiesController.ServiceName, 'getDisabilities');
        Disabilities.find().exec().then((results) => {
            return res.status(HttpStatus.OK).json(
                response[HttpStatus.OK]({
                    message: `List for disabilities`,
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
export default DisabilitiesController;
