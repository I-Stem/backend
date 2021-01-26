/**
 * Define Job Preferences api
 *
 */
import { Request, Response } from "express";
import { createResponse, response } from "../../../utils/response";
import * as HttpStatus from "http-status-codes";
import JobPreferences from "../../../models/JobPreferences";
import loggerFactory from "../../../middlewares/WinstonLogger";
import JobPreferencesModel from "../../../domain/Community/JobPreferencesModel";
import { plainToClass } from "class-transformer";
import emailService from "../../../services/EmailService";
import JobApplicationTemplate from "../../../MessageTemplates/JobApplicationTemplate";
import { getFormattedJson } from "../../../utils/formatter";
import UserModel from "../../../domain/user/User";
import FileModel from "../../../domain/FileModel";

class JobPreferencesController {
    static ServiceName = "JobPreferencesController";

    public static async addJobPreference(req: Request, res: Response) {
        const logger = loggerFactory(
            JobPreferencesController.ServiceName,
            "addJobPreference"
        );
        logger.info("Request Received: %o", req.body);
        const jobPreferenceInstance = plainToClass(
            JobPreferencesModel,
            req.body
        );
        const user = await UserModel.getUserById(res.locals.user.id);
        await jobPreferenceInstance.persistJobPreferences(
            res.locals.user.id,
            user?.fullname
        );

        if (user !== null) {
            emailService.reportJobApplication(
                JobApplicationTemplate.getJobApplicationMessage({
                    user: user,
                    formData: getFormattedJson({
                        ...req.body,
                        inputFileId: (
                            await FileModel.getFileById(req.body.inputFileId)
                        )?.inputURL,
                    }),
                })
            );

            emailService.sendEmailToUser(
                user,
                JobApplicationTemplate.getJobApplicationReceiptMessage({
                    user: user,
                    formData: "",
                })
            );
        }
        return createResponse(
            res,
            HttpStatus.OK,
            `job preference successfully stored`
        );
    }
    public static async getJobPreference(
        req: Request<{ userId: string }>,
        res: Response
    ) {
        const logger = loggerFactory(
            JobPreferencesController.ServiceName,
            "getJobPreference"
        );
        logger.info("Request Received: %o", req.body);
        let jobPreferences: any = "";
        try {
            jobPreferences = await JobPreferencesModel.jobPreferencesForUser(
                req.params.userId
            );
        } catch (error) {
            logger.error("Error occured while fetching job preferences data");
        }
        return createResponse(
            res,
            HttpStatus.OK,
            `job preferences for current user`,
            jobPreferences
        );
    }
}

export default JobPreferencesController;
