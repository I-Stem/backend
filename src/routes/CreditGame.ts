import {Router} from 'express';
import FeedbackCreditGameController from '../controllers/Api/gamifier/FeedbackGame';

const router = Router();

router.post('/feedback', FeedbackCreditGameController.addFeedback);
router.get('/feedback', FeedbackCreditGameController.getFeedbackCreditGameStatus);

export default router;
