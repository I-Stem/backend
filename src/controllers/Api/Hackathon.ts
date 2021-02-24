/**
 * Define Hackathon api
 *
 */
import { Request, Response } from "express";
import { createResponse } from "../../utils/response";
import * as HttpStatus from "http-status-codes";
import loggerFactory from "../../middlewares/WinstonLogger";
import HackathonModel from "../../domain/HackathonModel";
import { plainToClass } from "class-transformer";
import emailService from "../../services/EmailService";
import HackathonTemplate from "../../MessageTemplates/HackathonTemplate";
import { getFormattedJson } from "../../utils/formatter";
import UserModel from "../../domain/user/User";

class HackathonController {
    static ServiceName = "HackathonController";

    public static async addHackathon(req: Request, res: Response) {
        const logger = loggerFactory(
            HackathonController.ServiceName,
            "addHackathon"
        );
        logger.info("Request Received: %o", req.body);
        const hackathonInstance = plainToClass(HackathonModel, req.body);
        await hackathonInstance.persistHackathon(res.locals.user.id);

        const user = await UserModel.getUserById(res.locals.user.id);

        if (user !== null) {
            emailService.reportJobApplication(
                HackathonTemplate.getHackathonMessage({
                    user: user,
                    formData: getFormattedJson(req.body),
                })
            );

            emailService.sendEmailToUser(user, HackathonTemplate.getHackathonPlatformInvitationMessage(user));
        }
        return createResponse(
            res,
            HttpStatus.OK,
            `hackathon application successfully stored`
        );
    }
}

export default HackathonController;
