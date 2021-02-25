import FeedbackModel, {FeedbackCategory} from '../../domain/FeedbackModel';
import db from "../dbHandler";


describe('domain level operation for a generic feedback for I-Stem services', () => {

    before(async function() {
await db.createConnection();
    });
    it('should create new feedback entry in database', async () => {
    let feedbackInstance = new FeedbackModel();

    feedbackInstance.feedbackFor = FeedbackCategory.GENERIC;
    feedbackInstance.purpose = 'accessibility';
    feedbackInstance.likings = 'everything';
    feedbackInstance.dislikings = 'nothing';
    feedbackInstance.creditsRequested = 250;
    feedbackInstance.rating = 5;
    await feedbackInstance.persistFeedback('5f858d655c75a02b6c93d977');
});

after(async function() {
    await db.closeConnection();
});

});
