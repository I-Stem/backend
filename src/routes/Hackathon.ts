import { Router } from "express";
import HackathonController from "../controllers/Api/Hackathon";
import { createValidator, ValidatedRequest } from "express-joi-validation";
import Hackathon from "../validators/Hackathon";
import { HackathonRequestSchema } from "../interfaces/validators/hackathon";

const router = Router();
const validator = createValidator({
    passError: true,
});

router.post(
    "/",
    validator.body(Hackathon),
    (req: ValidatedRequest<HackathonRequestSchema>, res) => {
        HackathonController.addHackathon(req, res);
    }
);

export default router;
