import {Request, Response} from 'express';
import { getFormattedJson } from '../../../utils/formatter';
import loggerFactory from '../../../middlewares/WinstonLogger';
import * as HttpStatus from 'http-status-codes';
import { response } from '../../../utils/response';
import FeedbackModel, { FeedbackCategory, feedbackFormTitles } from '../../../domain/FeedbackModel';
import {AfcModel} from '../../../domain/AfcModel';
import {VcModel} from '../../../domain/VCModel';
import {EscalationModel} from '../../../domain/EscalationModel';
import {plainToClass} from 'class-transformer';
import MessageQueue from '../../../queues/message';
import EmailService from '../../../services/EmailService';
import FeedbackMessageTemplates from '../../../MessageTemplates/FeedbackTemplates';
import UserModel from '../../../domain/user/User';
import LedgerModel from '../../../domain/LedgerModel';

class FeedbackGameController {
static ServiceName = 'FeedbackGameController';

public static async addFeedback(req: Request, res: Response) {
    const logger = loggerFactory(FeedbackGameController.ServiceName, 'addFeedback');
    logger.info('Request Received: %o', req.body);
    const feedbackInstance = plainToClass(FeedbackModel, req.body);
    const userId = res.locals.user.id;
    feedbackInstance.persistFeedback(userId);
    const user = await UserModel.getUserById(userId);
    const serviceCount = await FeedbackModel.getFeedbackCountForUserByService(userId, feedbackInstance.feedbackFor);
    if (Number(serviceCount) === 1) {
        logger.info(`Adding 100 credits for first feedback of ${feedbackFormTitles.get(feedbackInstance.feedbackFor)}`);
        LedgerModel.createCreditTransaction(userId, 100, `Feedback for ${feedbackFormTitles.get(feedbackInstance.feedbackFor)}`);
    }

    EmailService.reportCustomerFeedback(FeedbackMessageTemplates.getFeedbackMessageTemplate({
        user: user,
        feedbackFor: feedbackInstance.feedbackFor,
        message: feedbackInstance
    }));
    return res.status(HttpStatus.OK).json(
        response[HttpStatus.OK]({
            message: `feedback successfully stored`
        }));
}

public static async getFeedbackCreditGameStatus(req: Request, res: Response) {
    const logger = loggerFactory(FeedbackGameController.ServiceName, 'getFeedbackCreditGameStatus');
    const loggedinUser = res.locals.user;
    logger.info('getting feedback status for user' + loggedinUser.id);

    const countServices =  await Promise.all([
    AfcModel.getAfcRequestCountForUser(loggedinUser.id),
    VcModel.getVcRequestCountForUser(loggedinUser.id),
    VcModel.getCustomModelVcRequestCount(loggedinUser.id),
    EscalationModel.getAfcEscalationCountForUser(loggedinUser.id),
    EscalationModel.getVcEscalationCountForUser(loggedinUser.id),
    FeedbackModel.getFeedbacksByUser(loggedinUser.id)
]);

    logger.info(`count: ${countServices}`);
    return res.status(HttpStatus.OK).json(
    response[HttpStatus.OK]({
        message: 'successfully calculated the flags.',
        data: {
            afcServiceUsed: countServices[0] > 0,
            vcServiceUsed: countServices[1] > 0,
            vcCustomModelServiceUsed: countServices[2] > 0,
            afcEscalated: countServices[3] > 0,
            vcEscalated: countServices[4] > 0,
            afcFeedbackProvided: countServices[5].filter((feedback: FeedbackModel) => feedback.feedbackFor === FeedbackCategory.AFC_SERVICE).length,
            vcStandardFeedbackProvided: countServices[5].filter((feedback: FeedbackModel) => feedback.feedbackFor === FeedbackCategory.VC_SERVICE).length,
            afcEscalateFeedbackProvided: countServices[5].filter((feedback: FeedbackModel) => feedback.feedbackFor === FeedbackCategory.AFC_SERVICE_ESCALATION).length,
            vcCustomFeedbackProvided: countServices[5].filter((feedback: FeedbackModel) => feedback.feedbackFor === FeedbackCategory.VC_CUSTOM_SERVICE).length,
vcEscalateFeedbackProvided: countServices[5].filter((feedback: FeedbackModel) => feedback.feedbackFor === FeedbackCategory.VC_SERVICE_ESCALATION).length
        }
    })
);
}

}

export default FeedbackGameController;
