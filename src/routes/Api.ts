/**
 * Define all your API web-routes
 *
 */

import { Router } from 'express';
import CreditController from '../controllers/Api/Credit';
import FileController from '../controllers/Api/File';
import AuthRouter from './Auth';
import TagRouter from './Tag';
import AfcRouter from './Afc';
import VcRouter from './Vc';
import FileRouter from './File';
import CreditRouter from './Credit';
import CreditGameRouter from './CreditGame';
import JobPreferencesRouter from './JobPreferences';
import DisabilitiesRouter from './Disabilities';
import IndustryRouter from './Industry';
import ServiceRouter from './Service';
import MentorshipRouter from './Mentorship';
import SkillsRouter from './Skills';
import WebinarRouter from './Webinars';
import UniversityPortalRouter from './University';

const router = Router();

router.use('/auth', AuthRouter);
router.use('/afc', AfcRouter);
router.use('/v1/ocr', AfcRouter);
router.use('/tag', TagRouter);
router.use('/vc', VcRouter);
router.use('/credits', CreditRouter);
router.use('/file', FileRouter);
router.use('/game', CreditGameRouter);
router.use('/job', JobPreferencesRouter);
router.use('/disabilities', DisabilitiesRouter);
router.use('/industry', IndustryRouter);
router.use('/service', ServiceRouter);
router.use('/mentorship', MentorshipRouter);
router.use('/skills', SkillsRouter);
router.use('/webinars', WebinarRouter);
router.use('/service', ServiceRouter);
router.use('/university', UniversityPortalRouter);

export default router;
