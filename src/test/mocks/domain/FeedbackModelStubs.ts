import FeedbackModel, {FeedbackCategory} from "../../../domain/FeedbackModel";

export const FeedbackModelStubs = {
    FiveStarAFCRating:     new FeedbackModel({
        userId: "to be set during test runtime",
    feedbackFor : FeedbackCategory.AFC_SERVICE,
    purpose : 'accessibility',
    likings : 'everything',
    dislikings : 'nothing',
    creditsRequested : 250,
    rating : 5
    }),

    FourStarAFCRating:     new FeedbackModel({
        userId: "to be set during test runtime",
    feedbackFor : FeedbackCategory.AFC_SERVICE,
    purpose : 'accessibility',
    likings : 'everything',
    dislikings : 'nothing',
    creditsRequested : 250,
    rating : 4
    }),

    FiveStarVCRating:     new FeedbackModel({
        userId: "to be set during test runtime",
    feedbackFor : FeedbackCategory.VC_SERVICE,
    purpose : 'accessibility',
    likings : 'everything',
    dislikings : 'nothing',
    creditsRequested : 250,
    rating : 5
    }),

    FourStarVCRating:     new FeedbackModel({
        userId: "to be set during test runtime",
    feedbackFor : FeedbackCategory.VC_SERVICE,
    purpose : 'accessibility',
    likings : 'everything',
    dislikings : 'nothing',
    creditsRequested : 250,
    rating : 4
    })
}