import loggerFactory from "../../../middlewares/WinstonLogger";
import JobPreferencesDbModel from "../../../models/JobPreferences";
import UserModel from "../../user/User";
import User from "../../../models/User";
import {HighestQualification, JobNature, HiringAction} from "./JobPreferencesConstants";
import FileModel from "../../FileModel";

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

export interface JobPreferencesProps {
    userId: string;
    userName?: string;
    seekingJob: Boolean;
    natureOfJob: JobNature;
    industry: string;
    idealPosition: string;
    highestEducation: HighestQualification;
    highestDegree: string;
    major: string;
    workExperience: string;
    totalExperience: string;
    associatedDisabilities: string[];
    currentPlace: string;
    canRelocate: Boolean;
    linkedIn: string;
    portfolioLink: string;
    resumeLink: string;
    needCareerHelp: Boolean;
    inputFileId: string;
    interested: string[];
    ignored: string[];
    actionLog: HiringActionLog[];
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
    inputFileId: string = "";
    interested: string[] = [];
    ignored: string[] = [];
    actionLog: HiringActionLog[] = [];

    constructor(props: JobPreferencesProps) {
        this.userId = props.userId;
        this.userName = props.userName;
        this.seekingJob = props.seekingJob;
        this.natureOfJob = props.natureOfJob;
        this.industry = props.industry;
        this.idealPosition = props.idealPosition;
        this.highestEducation = props.highestEducation;
        this.highestDegree = props.highestDegree;
        this.major = props.major;
        this.workExperience = props.workExperience;
        this.totalExperience = props.totalExperience;
        this.associatedDisabilities = props.associatedDisabilities;
        this.currentPlace = props.currentPlace;
        this.canRelocate = props.canRelocate;
        this.linkedIn = props.linkedIn;
        this.portfolioLink = props.portfolioLink;
        this.resumeLink = props.resumeLink;
        this.needCareerHelp = props.needCareerHelp;
        this.inputFileId = props.inputFileId;
        this.interested = props.interested;
        this.ignored = props.ignored;
        this.actionLog = props.actionLog;
    }

    async persistJobPreferences(currUserId: string) {
        const logger = loggerFactory(
            JobPreferencesModel.ServiceName,
            "persistJobPreferences"
        );
        const user = await UserModel.getUserById(currUserId);
        const resume = await FileModel.getFileById(this.inputFileId);
        this.userId = currUserId;
        this.userName = user?.fullname;
        this.resumeLink = resume?.inputURL || "";
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

