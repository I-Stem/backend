/**
 * Define all your AFC api-routes
 *
 */

import { Router } from 'express';
import TagController from '../controllers/Api/Tag';
import { createValidator, ValidatedRequest } from 'express-joi-validation';
import { TagRequestSchema } from '../interfaces/validators/tag';
import TagSchema from '../validators/Tag';

const router = Router();

const validator = createValidator({
    passError: true
});

router.post('/',
    validator.body(TagSchema),
    (req: ValidatedRequest<TagRequestSchema>, res) => {
        TagController.post(req, res);
    }
);
router.patch('/:id',
    validator.body(TagSchema),
    (req: ValidatedRequest<TagRequestSchema>, res) => {
        TagController.patch(req, res);
    }
);
router.get('/', TagController.index);

export default router;
