import {Router} from 'express';
import WebinarsController from '../controllers/Api/Webinars';

const router = Router();

router.get('/', WebinarsController.getWebinars);
router.post('/add', WebinarsController.addWebinars);

export default router;
