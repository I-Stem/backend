import User from '../models/User';
import loggerFactory from '../middlewares/WinstonLogger';

export default class Credit {
    static serviceName = 'Credit';
    public static async getUserCredits(userId: string): Promise<number> {
        const logger = loggerFactory(Credit.serviceName, 'getUserCredits');
        logger.info(`Get user credits`);
        let credits = 0;
        await User.findById(userId)
            .exec()
            .then(async (user) => {
                await user
                    ?.getCredits()
                    .then((totalCredits: number) => {
                        credits = totalCredits;
                    })
                    .catch((err) => {
                        return new Error(
                            `Error occurred retriving the user credits: ${err}`
                        );
                    });
            })
            .catch((err) => {
                return new Error(`Error occurred retriving the user: ${err}`);
            });
        logger.info(`Total credits: ${credits}`);
        return credits;
    }
}
