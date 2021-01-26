import { Router } from "express";
import HiringController from "../controllers/Api/organization/Hiring";

const router = Router();

router.post("/", HiringController.index);
router.post("/action", HiringController.businessAction);
router.post("/contact", HiringController.contactCandidate);
router.post("/comments", HiringController.getCommentsForCandidate);

export default router;
