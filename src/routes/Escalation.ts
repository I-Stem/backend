import { Router } from "express";
import EscalationController from "../controllers/Api/Escalation";

const router = Router();
router.get("/", EscalationController.index);
router.get("/details", EscalationController.escalationDetails);
router.post("/assign", EscalationController.assignResolver);
router.post("/resolve", EscalationController.resolve);

export default router;
