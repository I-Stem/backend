import FeedbackModel, {FeedbackCategory} from '../../domain/FeedbackModel';
import db from "../dbHandler";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import {FeedbackModelStubs} from "../mocks/domain/FeedbackModelStubs";
import { expect } from 'chai';

describe('domain level operation for a generic feedback for I-Stem services', () => {
const feedbacker = UserModelStubs.JohnSnow;
const feedbackInstance = FeedbackModelStubs.FiveStarAFCRating;
    before(async function() {
await db.createConnection();
await feedbacker.persist();
    });


    it('should create new feedback entry in database', async () => {
    const result = await feedbackInstance.persistFeedback(feedbacker.userId);

    expect(result.feedbackId.toString().length).to.above(20);
});

it('should get all feedbacks for user', async () => {
    const result = await FeedbackModel.getFeedbacksByUser(feedbacker.userId);

    expect(result.length).to.equal(1);
});

it('should get count of all feedbacks for user for given service', async () => {
    await FeedbackModelStubs.FourStarAFCRating.persistFeedback(feedbacker.userId);
    const result = await FeedbackModel.getFeedbackCountForUserByService(feedbacker.userId, FeedbackCategory.AFC_SERVICE);

    expect(result).to.equal(2);
});

it('should get count of all feedbacks for user for given service along with rating sum', async () => {
    const result = await FeedbackModel.getFeedbackRatingCountForUser(feedbacker.userId, FeedbackCategory.AFC_SERVICE);

    expect(result.rating).to.equal(9);
    expect(result.count).to.equal(2);
});

after(async function() {
    await db.closeConnection();
});

});
