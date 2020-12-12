import loggerFactory from '../middlewares/WinstonLogger';
import FeedbackDbModel from '../models/feedback';

export const enum FeedbackCategory {
    AFC_SERVICE = 'afc_service',
     AFC_SERVICE_ESCALATION =  'afc_service_escalation',
     VC_SERVICE =  'vc_service',
      VC_SERVICE_ESCALATION = 'vc_service_escalation',
       VC_CUSTOM_SERVICE = 'vc_custom_service',
        GENERIC = 'generic'
}

export const feedbackFormTitles = new Map([
    [FeedbackCategory.AFC_SERVICE, 'Document Accessibility Service'],
    [FeedbackCategory.AFC_SERVICE_ESCALATION, 'Escalation of Document Accessibility Service Requests'],
    [FeedbackCategory.VC_SERVICE, 'Audio/Video Accessibility Service'],
    [FeedbackCategory.VC_SERVICE_ESCALATION, 'Escalation of Audio/Video Accessibility Service Requests'],
    [FeedbackCategory.VC_CUSTOM_SERVICE, 'Audio/Video Accessibility Service Using Custom Training Models'],
    [FeedbackCategory.GENERIC, '']
]);
class FeedbackModel {

    static ServiceName = 'FeedbackModel';

userId: string = '';
feedbackFor: FeedbackCategory = FeedbackCategory.GENERIC;
rating: number = 0;
purpose: string = '';
likings: string = '';
dislikings: string = '';
creditsRequested: number = 0;

persistFeedback(currUserId: string) {
    const logger = loggerFactory(FeedbackModel.ServiceName, 'persistFeedback');
    this.userId = currUserId;
    new FeedbackDbModel(this)
.save((err: any) => {
    if (err) {
    logger.error(err);
    }
});

}

public static async getFeedbacksByUser(userId: string): Promise<FeedbackModel[]> {
    const logger = loggerFactory(FeedbackModel.ServiceName, 'getFeedbacksByUser');
    logger.info(`Retrieving feedbacks by user: ${userId}`);
    return FeedbackDbModel.find({userId: userId}).exec();
}

public static async getFeedbackCountForUserByService(userId: string, service: FeedbackCategory): Promise<any> {
    const logger = loggerFactory(FeedbackModel.ServiceName, 'getFeedbackCountForUserByService');
    logger.info(`Retrieving feedbacks count by user: ${userId}`);
    const documentCount =  await FeedbackDbModel.countDocuments({userId: userId, feedbackFor: service}).lean();
    return documentCount;
}

public static async getFeedbackRatingCountForUser(userId: string, service: FeedbackCategory) {
    let rating = 0;
    let count = 0;
    await FeedbackDbModel.find({userId, feedbackFor: service }).exec().then(feedback => {
        count = feedback.length;
        feedback.forEach(element => {
            rating += Number(element.rating);
        })
    })
    return {count, rating}
}

}

export default FeedbackModel;
