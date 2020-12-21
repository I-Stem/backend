/**
 * Define all your AFC api-routes
 *
 */

import { Router } from 'express';
import formidable from 'express-formidable';
import FileController from '../controllers/Api/File';

const router = Router();

router.post('/', formidable(), FileController.upload);

export default router;
