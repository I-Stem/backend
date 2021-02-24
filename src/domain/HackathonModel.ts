import loggerFactory from "../middlewares/WinstonLogger";
import HackathonDbModel from "../models/Hackathon";

class HackathonModel {
    static ServiceName = "HackathonModel";

    userId: string = "";
    isPWD: Boolean = false;
    associatedDisabilities: string[] = [];
    designation: string = "";
    orgName: string = "";
    canCode: Boolean = false;
    anythingElse: string = "";
    expectations: string = "";
    preferedAreas: string = "";

    persistHackathon(currUserId: string) {
        const logger = loggerFactory(
            HackathonModel.ServiceName,
            "persistHackathon"
        );
        this.userId = currUserId;
        new HackathonDbModel(this).save((err: any) => {
            if (err) {
                logger.error(err);
            }
        });
    }

    public static async hackathonForUser(userId: string) {
        const logger = loggerFactory(
            HackathonModel.ServiceName,
            "hackathonForUser"
        );
        logger.info(`Job Preferences by user: ${userId}`);
        try {
            const data = await HackathonDbModel.find({
                userId: userId,
            }).exec();
            return data;
        } catch (error) {
            logger.error(
                "Error occured while fetching hackathon data for user"
            );
        }
    }
}

export default HackathonModel;
