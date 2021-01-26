import { Router } from "express";
import JobPreferencesController from "../controllers/Api/Community/JobPreferences";
import { createValidator, ValidatedRequest } from "express-joi-validation";
import JobPreferences from "../validators/JobPreferencs";
import { JobPreferencesRequestSchema } from "../interfaces/validators/jobPreferences";

const router = Router();
const validator = createValidator({
    passError: true,
});

router.post(
    "/",
    validator.body(JobPreferences),
    (req: ValidatedRequest<JobPreferencesRequestSchema>, res) => {
        JobPreferencesController.addJobPreference(req, res);
    }
);
router.get("/:userId", JobPreferencesController.getJobPreference);

export default router;
