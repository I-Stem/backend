import { Request, Response } from "express";
import { createResponse, response } from "../../../utils/response";
import loggerFactory from "../../../middlewares/WinstonLogger";
import * as HttpStatus from "http-status-codes";
import HiringModel from "../../../domain/organization/HiringModel";
import User from "../../../models/User";
import UserModel from "../../../domain/user/User";

class HiringController {
    static servicename = "Hiring Controller";
    public static async index(req: Request, res: Response) {
        const methodname = "index";
        const logger = loggerFactory(HiringController.servicename, methodname);
        logger.info("Request Received: %o", req.body);
        let candidates;
        try {
            candidates = await HiringModel.hiringFilter(
                req.body,
                res.locals.user.organizationCode,
                String(req.query.status)
            );
        } catch (error) {
            logger.error(
                "Error occured while fetching job preferences data: %o",
                error
            );
        }
        return createResponse(
            res,
            HttpStatus.OK,
            `Candidates list`,
            candidates
        );
    }

    public static async getCommentsForCandidate(req: Request, res: Response) {
        const methodname = "getCommentsForCandidate";
        const logger = loggerFactory(HiringController.servicename, methodname);
        logger.info("Request Received: %o", req.body);
        let comments;
        try {
            comments = await HiringModel.commentsForCandidate(
                req.body.jobId,
                res.locals.user.organizationCode
            );
        } catch (error) {
            logger.error(
                "Error occured while getting comments for candidate %o",
                error
            );
        }
        return createResponse(res, HttpStatus.OK, `Comments`, comments);
    }

    public static async contactCandidate(req: Request, res: Response) {
        const methodname = "contactCandidate";
        const logger = loggerFactory(HiringController.servicename, methodname);
        logger.info("Request Received: %o", req.body);
        try {
            await HiringModel.contactCandidate(
                req.body.subject,
                req.body.message,
                res.locals.user,
                req.body.jobId
            );
        } catch (error) {
            logger.error(
                "Error occured while sending email to candidate: %o",
                error
            );
        }
        return createResponse(res, HttpStatus.OK, `Candidate notified`);
    }

    public static async businessAction(req: Request, res: Response) {
        const methodname = "businessAction";
        const logger = loggerFactory(HiringController.servicename, methodname);
        logger.info("Request Received: %o", req.body);
        try {
            const user = await UserModel.getUserById(res.locals.user.id);
            await HiringModel.updateBusinessAction(
                res.locals.user.organizationCode,
                req.body.action,
                req.body.jobId,
                user?.fullname,
                req.body.comment
            );
        } catch (error) {
            logger.error(
                "Error occured while updating job preference: %o",
                error
            );
        }
        return createResponse(res, HttpStatus.OK, `Updated job`);
    }
}
export default HiringController;
