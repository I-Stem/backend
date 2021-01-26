import loggerFactory from "../middlewares/WinstonLogger";
import JobPreferencesDbModel from "../models/JobPreferences";

export const enum JobNature {
    INTERNSHIP = "internship",
    FULL_TIME = "full_time",
    BOTH = "both",
}

export const enum HighestQualification {
    TENTH_STD = "10th_std",
    TWELFTH_STD = "12th_std",
    GRADUATE_DEGREE = "graduate_degree",
    POST_GRADUATE_DEGREE = "post_graduate_degree",
}

class JobPreferencesModel {
    static ServiceName = "JobPreferencesModel";

    userId: string = "";
    seekingJob: Boolean = false;
    natureOfJob: JobNature = JobNature.INTERNSHIP;
    industry: string = "";
    idealPosition: string = "";
    highestEducation: HighestQualification = HighestQualification.TENTH_STD;
    highestDegree: string = "";
    major: string = "";
    workExperience: string = "";
    associatedDisabilities: string = "";
    currentPlace: string = "";
    canRelocate: Boolean = false;
    linkedIn: string = "";
    portfolioLink: string = "";
    resumeLink: string = "";
    needCareerHelp: Boolean = false;
    inputFileId: String = "";

    persistJobPreferences(currUserId: string) {
        const logger = loggerFactory(
            JobPreferencesModel.ServiceName,
            "persistJobPreferences"
        );
        this.userId = currUserId;
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
