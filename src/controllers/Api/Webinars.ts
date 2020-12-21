/**
 * Define Webinars api
 *
 */
import { Request, Response } from 'express';
import { createResponse, response } from '../../utils/response';
import * as HttpStatus from 'http-status-codes';
import Webinars from '../../models/Webinars';
import loggerFactory from '../../middlewares/WinstonLogger';
import WebinarsModel from '../../domain/WebinarsModel';
import {plainToClass} from 'class-transformer';

class WebinarsController {
    static ServiceName = 'Webinars Controller';
    public static getWebinars(req: Request, res: Response) {
        const logger = loggerFactory(WebinarsController.ServiceName, 'getWebinars');
        Webinars.find().exec().then((results) => {
            return res.status(HttpStatus.OK).json(
                response[HttpStatus.OK]({
                    message: `List for Webinars`,
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
    public static addWebinars(req: Request, res: Response) {
        const logger = loggerFactory(WebinarsController.ServiceName, 'addWebinars');
        logger.info('Request Received: %o', req.body);
        const WebinarsInstance = plainToClass(WebinarsModel, req.body);
        WebinarsInstance.persistWebinars(res.locals.user.id);
        return res.status(HttpStatus.OK).json(
            response[HttpStatus.OK]({
                message: `Webinar successfully stored`,
                data: req.body
            }));
    }
}
export default WebinarsController;
