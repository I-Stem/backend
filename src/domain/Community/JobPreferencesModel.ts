import { query } from "express";
import loggerFactory from "../../middlewares/WinstonLogger";
import JobPreferencesDbModel from "../../models/JobPreferences";
import UserModel from "../user/User";
import User from "../../models/User";

export const enum JobNature {
    INTERNSHIP = "INTERNSHIP",
    FULL_TIME = "FULL_TIME",
    BOTH = "BOTH",
}

export const enum HighestQualification {
    TENTH_STD = "10TH_STD",
    TWELFTH_STD = "12TH_STD",
    GRADUATE_DEGREE = "GRADUATE_DEGREE",
    POST_GRADUATE_DEGREE = "POST_GRADUATE_DEGREE",
}

export const enum HiringAction {
    IGNORED = "IGNORED",
    SHORTLISTED = "SHORTLISTED",
    COMMENTED = "COMMENTED",
    CONTACTED = "CONTACTED",
}

export class HiringActionLog {
    action?: HiringAction;
    actionBy?: string;
    organization?: string;
    comment?: string;
    actionAt?: Date;
    constructor(props: HiringActionLog) {
        this.action = props.action;
        this.actionBy = props.actionBy;
        this.organization = props.organization;
        this.comment = props.comment;
        this.actionAt = new Date();
    }
}

class JobPreferencesModel {
    static ServiceName = "JobPreferencesModel";

    userId: string = "";
    userName?: string = "";
    seekingJob: Boolean = false;
    natureOfJob: JobNature = JobNature.INTERNSHIP;
    industry: string = "";
    idealPosition: string = "";
    highestEducation: HighestQualification = HighestQualification.TENTH_STD;
    highestDegree: string = "";
    major: string = "";
    workExperience: string = "";
    totalExperience: string = "";
    associatedDisabilities: string[] = [];
    currentPlace: string = "";
    canRelocate: Boolean = false;
    linkedIn: string = "";
    portfolioLink: string = "";
    resumeLink: string = "";
    needCareerHelp: Boolean = false;
    inputFileId: String = "";
    interested: string[] = [];
    ignored: string[] = [];
    actionLog: HiringActionLog[] = [];

    persistJobPreferences(currUserId: string, currUserName?: string) {
        const logger = loggerFactory(
            JobPreferencesModel.ServiceName,
            "persistJobPreferences"
        );
        this.userId = currUserId;
        this.userName = currUserName;
        new JobPreferencesDbModel(this).save((err: any) => {
            if (err) {
                logger.error(err);
            }
        });
    }

    public static async jobPreferencesForUser(userId: string) {
        const logger = loggerFactory(
            JobPreferencesModel.ServiceName,
            "jobPreferencesForUser"
        );
        logger.info(`Job Preferences by user: ${userId}`);
        try {
            const data = await JobPreferencesDbModel.find({
                userId: userId,
            }).exec();
            return data;
        } catch (error) {
            logger.error("Error occured while fetching job data for user");
        }
    }
}

export default JobPreferencesModel;
