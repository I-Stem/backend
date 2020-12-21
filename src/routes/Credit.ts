/**
 * Define all your Credit api-routes
 *
 */

import { Router } from 'express';

import CreditController from '../controllers/Api/Credit';

const router = Router();

router.get('/', CreditController.perform);
router.get('/count', CreditController.count);

export default router;
