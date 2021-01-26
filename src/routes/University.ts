/**
 * University Portal Routes
 */
import UniversityController from "../controllers/Api/University";
import { createValidator, ValidatedRequest } from "express-joi-validation";
import University from "../validators/University";
import { UniversityRequestSchema } from "../interfaces/validators/university";

import { Router } from "express";

const router = Router();
const validator = createValidator({
    passError: true,
});

router.post("/student", UniversityController.studentDataValidator);

router.post("/invite", UniversityController.addInvitedUsers);

router.get("/", UniversityController.getUniversityData);

router.post(
    "/register",
    validator.body(University),
    (req: ValidatedRequest<UniversityRequestSchema>, res) => {
        UniversityController.registerUniversity(req, res);
    }
);

router.get("/index/student", UniversityController.studentDetails);

router.get("/index", UniversityController.index);

router.get("/metrics", UniversityController.universityMetrics);

router.post(
    "/settings",
    validator.body(University),
    (req: ValidatedRequest<UniversityRequestSchema>, res) => {
        UniversityController.universitySettings(req, res);
    }
);

router.get(
    "/organ/req/:organizationCode/:action",
    UniversityController.handleRequest
);

router.post("/index/student/update", UniversityController.updateStudentDetails);

router.post("/onboardCards", UniversityController.updateUniversityCards);

router.get("/studentsCount", UniversityController.studentsCount);
export default router;
