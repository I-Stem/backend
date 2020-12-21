import {Router} from 'express';
import SkillsController from '../controllers/Api/Skills';

const router = Router();

router.get('/', SkillsController.getSkills);
router.post('/add', SkillsController.addSkills);

export default router;
