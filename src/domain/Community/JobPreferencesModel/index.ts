import loggerFactory from "../../../middlewares/WinstonLogger";
import JobPreferencesDbModel from "../../../models/JobPreferences";
import UserModel from "../../user/User";
import User from "../../../models/User";
import {HighestQualification, JobNature, HiringAction} from "./JobPreferencesConstants";

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

export class JobPreferencesModel {
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


