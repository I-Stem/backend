import {Router} from 'express';
import JobPreferencesModel from 'src/domain/JobPreferencesModel';
import JobPreferencesController from '../controllers/Api/JobPreferences';
import { createValidator, ValidatedRequest } from 'express-joi-validation';
import JobPreferences from '../validators/JobPreferencs';
import {JobPreferencesRequestSchema} from '../interfaces/validators/jobPreferences';

const router = Router();
const validator = createValidator({
    passError: true
});

router.post('/',
    validator.body(JobPreferences),
    (req: ValidatedRequest<JobPreferencesRequestSchema>, res) => {
        JobPreferencesController.addJobPreference(req, res);
    });
export default router;
