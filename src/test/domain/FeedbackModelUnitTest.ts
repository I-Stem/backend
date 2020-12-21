import FeedbackModel, {FeedbackCategory} from '../../domain/FeedbackModel';

describe('domain level operation for a generic feedback for I-Stem services', () => {

    it('should create new feedback entry in database', async () => {
    let feedbackInstance = new FeedbackModel();

    feedbackInstance.feedbackFor = FeedbackCategory.GENERIC;
    feedbackInstance.purpose = 'accessibility';
    feedbackInstance.likings = 'everything';
    feedbackInstance.dislikings = 'nothing';
    feedbackInstance.creditsRequested = 250;
    feedbackInstance.persistFeedback('5f858d655c75a02b6c93d977');
});

});
