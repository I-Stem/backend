import { query } from "express";
import loggerFactory from "../../middlewares/WinstonLogger";
import JobPreferencesDbModel from "../../models/JobPreferences";
import UserModel from "../user/User";
import {
    HiringAction,
    HiringActionLog,
} from "../Community/JobPreferencesModel";
import emailService from "../../services/EmailService";
import JobApplicationTemplate from "../../MessageTemplates/JobApplicationTemplate";

class HiringModel {
    static ServiceName = "HiringModel";

    public static async contactCandidate(
        subject: string,
        message: string,
        user: UserModel,
        jobId: string
    ) {
        const logger = loggerFactory(
            HiringModel.ServiceName,
            "contactCandidate"
        );
        logger.info(
            `Contact candidate on behalf of %o: ${user.organizationCode}`
        );
        try {
            const ccIStem = process.env.ISTEM_CC_EMAIL || "";
            const jobCandidate = await JobPreferencesDbModel.findById(
                jobId
            ).exec();
            if (jobCandidate) {
                const candidate = await UserModel.getUserById(
                    jobCandidate.userId
                );
                if (candidate) {
                    emailService.sendEmailToCandidate(
                        JobApplicationTemplate.contactCandidateMessage({
                            subject,
                            message,
                        }),
                        candidate,
                        [user.email, ccIStem]
                    );
                }
            }
        } catch (error) {
            logger.error(
                "Error Occured while sending email to candidate %o",
                error
            );
        }
    }

    public static async commentsForCandidate(
        jobId: string,
        organizationCode: string
    ) {
        const logger = loggerFactory(
            HiringModel.ServiceName,
            "commentsForCandidate"
        );
        logger.info(`Comments for candidate %o: ${jobId}`);
        const comments: any[] = [];
        try {
            await JobPreferencesDbModel.findById(jobId)
                .exec()
                .then((candidate) => {
                    const actionCount = candidate.actionLog.length;
                    for (let i = 0; i < actionCount; i++) {
                        if (
                            candidate.actionLog[i].action ===
                                HiringAction.COMMENTED &&
                            candidate.actionLog[i].organization ===
                                organizationCode
                        ) {
                            comments.push(candidate.actionLog[i]);
                        }
                    }
                });
        } catch (error) {
            logger.error(
                "Error occured while fetching comments for candidate %o",
                error
            );
        }
        return comments;
    }

    public static async updateBusinessAction(
        organizationCode: string,
        action: HiringAction,
        jobId: string,
        actionBy?: string,
        comment?: string
    ) {
        const logger = loggerFactory(
            HiringModel.ServiceName,
            "updateBusinessAction"
        );
        logger.info(`Job Preferences filter %o: ${action}`);
        try {
            await JobPreferencesDbModel.findByIdAndUpdate(jobId, {
                $push: {
                    actionLog: new HiringActionLog({
                        action: action,
                        actionBy: actionBy,
                        comment: comment,
                        organization: organizationCode,
                        actionAt: new Date(),
                    }),
                },
            }).exec();
        } catch (error) {
            logger.error("Error Occured");
        }
    }
    public static async hiringFilter(
        filter: any,
        organizationCode: string,
        status?: string
    ): Promise<any[]> {
        const logger = loggerFactory(HiringModel.ServiceName, "hiringFilter");
        logger.info(`Job Preferences filter: ${filter}`);
        const candidateData: any[] = [];
        let data;
        let queries: any = { $and: [] };
        if (Object.keys(filter).length > 0) {
            if ("jobType" in filter)
                queries.$and.push({ natureOfJob: filter.jobType });
            if ("highestEducation" in filter)
                queries.$and.push({
                    highestEducation: { $gte: filter.highestEducation },
                });
            if ("canRelocate" in filter)
                queries.$and.push({ canRelocate: filter.canRelocate });

            if ("disabilities" in filter)
                queries.$and.push({
                    associatedDisabilities: { $all: filter.disabilities },
                });
            if ("industry" in filter)
                queries.$and.push({ industry: filter.industry });
            if ("major" in filter)
                queries.$and.push({
                    major: new RegExp(String(filter.major), "i"),
                });
            if ("totalExperience" in filter)
                queries.$and.push({ totalExperience: filter.totalExperience });
            if ("highestDegree" in filter)
                queries.$and.push({
                    highestDegree: new RegExp(
                        String(filter.highestDegree),
                        "i"
                    ),
                });
            if ("location" in filter)
                queries.$and.push({
                    location: new RegExp(String(filter.location), "i"),
                });
            if ("status" in filter)
                if (filter.status !== "NEW") {
                    queries.$and.push({
                        "actionLog.action": filter.status,
                        "actionLog.organization": organizationCode,
                    });
                } else {
                    queries.$and.push({
                        "actionLog.organization": { $ne: organizationCode },
                    });
                }
        } else {
            queries = {
                "actionLog.organization": { $ne: organizationCode },
            };
        }
        try {
            data = await JobPreferencesDbModel.find(queries).exec();
        } catch (error) {
            logger.error("Error occured while fetching job ", error);
        }
        return data;
    }
}
export default HiringModel;
