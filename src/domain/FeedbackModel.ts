import loggerFactory from "../middlewares/WinstonLogger";
import FeedbackDbModel from "../models/feedback";

export const enum FeedbackCategory {
    AFC_SERVICE = "afc_service",
    AFC_SERVICE_ESCALATION = "afc_service_escalation",
    VC_SERVICE = "vc_service",
    VC_SERVICE_ESCALATION = "vc_service_escalation",
    VC_CUSTOM_SERVICE = "vc_custom_service",
    GENERIC = "generic",
}

export const feedbackFormTitles = new Map([
    [FeedbackCategory.AFC_SERVICE, "Document Accessibility Service"],
    [
        FeedbackCategory.AFC_SERVICE_ESCALATION,
        "Escalation of Document Accessibility Service Requests",
    ],
    [FeedbackCategory.VC_SERVICE, "Audio/Video Accessibility Service"],
    [
        FeedbackCategory.VC_SERVICE_ESCALATION,
        "Escalation of Audio/Video Accessibility Service Requests",
    ],
    [
        FeedbackCategory.VC_CUSTOM_SERVICE,
        "Audio/Video Accessibility Service Using Custom Training Models",
    ],
    [FeedbackCategory.GENERIC, ""],
]);

export interface FeedbackModelProps {
    _id?: string;
    feedbackId?: string;
    userId: string;
    feedbackFor: FeedbackCategory;
    rating: number;
    purpose: string;
    likings: string;
    dislikings: string;
    creditsRequested: number;
}

class FeedbackModel {
    static ServiceName = "FeedbackModel";

    feedbackId?: string;
    userId: string = "";
    feedbackFor: FeedbackCategory = FeedbackCategory.GENERIC;
    rating: number = 0;
    purpose: string = "";
    likings: string = "";
    dislikings: string = "";
    creditsRequested: number = 0;

constructor(props : FeedbackModelProps) {
    this.feedbackId = props.feedbackId || props._id;
    this.userId = props.userId;
    this.feedbackFor = props.feedbackFor;
    this.rating = props.rating;
    this.purpose = props.purpose;
    this.likings = props.likings;
    this.dislikings = props.dislikings;
    this.creditsRequested = props.creditsRequested;
}

    async persistFeedback(currUserId: string) {
        const logger = loggerFactory(
            FeedbackModel.ServiceName,
            "persistFeedback"
        );
        this.userId = currUserId;
        try {
        const feedbackInstance = await new FeedbackDbModel(this).save();
        this.feedbackId = feedbackInstance.id;
        return this;
        } catch (err) {
                logger.error(err);
            }

            return undefined;
    }

    public static async getFeedbacksByUser(
        userId: string
    ): Promise<FeedbackModel[]> {
        const logger = loggerFactory(
            FeedbackModel.ServiceName,
            "getFeedbacksByUser"
        );
        logger.info(`Retrieving feedbacks by user: ${userId}`);
        return FeedbackDbModel.find({ userId: userId }).exec();
    }

    public static async getFeedbackCountForUserByService(
        userId: string,
        service: FeedbackCategory
    ): Promise<any> {
        const logger = loggerFactory(
            FeedbackModel.ServiceName,
            "getFeedbackCountForUserByService"
        );
        logger.info(`Retrieving feedbacks count by user: ${userId}`);
        const documentCount = await FeedbackDbModel.countDocuments({
            userId: userId,
            feedbackFor: service,
        }).lean();
        return documentCount;
    }

    public static async getFeedbackRatingCountForUser(
        userId: string,
        service: FeedbackCategory
    ) {
        let rating = 0;
        let count = 0;
        await FeedbackDbModel.find({ userId, feedbackFor: service })
            .exec()
            .then((feedback) => {
                feedback.forEach((element) => {
                    if (!isNaN(element.rating)) {
                        count += 1;
                        rating += Number(element.rating);
                    }
                });
            });
        return { count, rating };
    }
}

export default FeedbackModel;
