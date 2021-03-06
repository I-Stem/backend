import { Router } from "express";
import MentorshipController from "../controllers/Api/Community/Mentorship";
import { createValidator, ValidatedRequest } from "express-joi-validation";
import Mentorship from "../validators/Mentorship";
import { MentorshipRequestSchema } from "../interfaces/validators/mentorship";

const router = Router();
const validator = createValidator({
    passError: true,
});

router.post(
    "/",
    validator.body(Mentorship),
    (req: ValidatedRequest<MentorshipRequestSchema>, res) => {
        MentorshipController.addMentorship(req, res);
    }
);
router.get("/", MentorshipController.get);
export default router;
