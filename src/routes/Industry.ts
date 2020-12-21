import {Router} from 'express';
import IndustryController from '../controllers/Api/Industry';

const router = Router();

router.get('/', IndustryController.getIndustry);

export default router;
