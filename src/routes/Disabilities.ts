import {Router} from 'express';
import DisabilitiesController from '../controllers/Api/Disabilities';

const router = Router();

router.get('/', DisabilitiesController.getDisabilities);

export default router;
