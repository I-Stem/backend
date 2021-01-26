/**
 * Define all your AFC api-routes
 *
 */

import { Router } from "express";
import AFCController from "../controllers/Api/AFC";
import { createValidator, ValidatedRequest } from "express-joi-validation";
import { AFCRequestSchema } from "../interfaces/validators/afc";
import AFCSchema from "../validators/AFC";

const router = Router();

const validator = createValidator({
    passError: true,
});

router.post(
    "/",
    validator.body(AFCSchema),
    (req: ValidatedRequest<AFCRequestSchema>, res) => {
        AFCController.post(req, res);
    }
);

router.post("/failed/:id", AFCController.updateAfcForFailedRequests);
router.post("/callback", AFCController.afcCallback);


router.patch("/:id/review", AFCController.submitAFCReview);

router.post("/:id/escalate", AFCController.escalateRequest);
router.get("/", AFCController.index);
router.get("/afcCount", AFCController.afcCount);
router.get("/review", AFCController.submitAFCReview);

export default router;
