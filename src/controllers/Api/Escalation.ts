import { Request, Response } from "express";
import User, { IUserModel } from "../../models/User";
import { createResponse, response } from "../../utils/response";
import * as HttpStatus from "http-status-codes";
import Escalation from "../../models/Escalation";

import loggerFactory from "../../middlewares/WinstonLogger";
import EscalationModel from "../../domain/EscalationModel";
import File from "../../models/File";

class EscalationController {
    static servicename = "Escalation Controller";
    public static async index(req: Request, res: Response) {
        const methodname = "index";
        const logger = loggerFactory(
            EscalationController.servicename,
            methodname
        );
        let escalations: any = [];
        try {
            escalations = await EscalationModel.getEscalationsByOrganization(
                res.locals.user.organizationCode
            );
        } catch (err) {
            logger.error("Escalations not found");
        }
        return createResponse(
            res,
            HttpStatus.OK,
            `escalations results retrieved`,
            escalations
        );
    }

    public static async escalationDetails(req: Request, res: Response) {
        const methodname = "escalationDetails";
        const logger = loggerFactory(
            EscalationController.servicename,
            methodname
        );
        let escalationDetails: any = "";
        try {
            escalationDetails = await EscalationModel.getEscalationDetailsById(
                String(req.query.id)
            );
        } catch (error) {
            logger.error("Error occured while getting escalation details");
        }
        return createResponse(
            res,
            HttpStatus.OK,
            `escalation details`,
            escalationDetails
        );
    }

    public static assignResolver(req: Request, res: Response) {
        const methodname = "assignResolver";
        const logger = loggerFactory(
            EscalationController.servicename,
            methodname
        );
        try {
            EscalationModel.updateResolver(req.body.id, res.locals.user.id);
        } catch (error) {
            logger.error("Error occured while assigning escalation");
        }
        return createResponse(res, HttpStatus.OK, `escalations assigned`);
    }

    public static async resolve(req: Request, res: Response) {
        const methodname = "resolve";
        const logger = loggerFactory(
            EscalationController.servicename,
            methodname
        );

        try {
            await EscalationModel.updateReimediatedFile(
                req.body.id,
                req.body.inputFileLink
            );
            await EscalationModel.notifyEscalator(req.body.id);
        } catch (error) {
            logger.error("Error occured");
        }
        createResponse(res, HttpStatus.OK, `escalations resolved`);
    }
}
export default EscalationController;
