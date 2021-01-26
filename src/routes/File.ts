/**
 * Define all your AFC api-routes
 *
 */

import { Router } from 'express';
import formidable from 'express-formidable';
import FileController from '../controllers/Api/File';

const router = Router();

router.post('/', formidable({
    maxFileSize: Number(process.env.MAX_FILE_UPLOAD_LIMIT) * 1024 * 1024
}), FileController.upload);

export default router;
