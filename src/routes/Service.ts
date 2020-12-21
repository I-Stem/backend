import { Router } from 'express';
import ServiceController from '../controllers/Api/Service';

const router = Router();

router.get('/', ServiceController.index);

router.get('/access', ServiceController.getAccessRequest);

router.get('/email/:email', ServiceController.upgradeUser);

export default router;
