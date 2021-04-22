/**
 * Define all your Vc api-routes
 *
 */

import { Router } from "express";
import VCController from "../controllers/Api/VC";
import { createValidator, ValidatedRequest } from "express-joi-validation";
import { VCRequestSchema } from "../interfaces/validators/vc";
import VCSchema from "../validators/VC";

const router = Router();

const validator = createValidator({
    passError: true,
});

router.post(
    "/",
    validator.body(VCSchema),
    (req: ValidatedRequest<VCRequestSchema>, res) => {
        VCController.post(req, res);
    }
);

router.post("/callback", VCController.vcCallback);

router.post("/:id/review", VCController.submitVCReview);
router.post("/:id/escalate", VCController.escalateRequest);
router.post("/failed/:id", VCController.updateVcForFailedRequests);

router.get("/", VCController.index);

router.post("/model", VCController.addCustomLanguageModel);

router.get("/model", VCController.getAllModelsOfUser);
router.get("/vcCount", VCController.vcCount);
router.get("/details", VCController.fetchVcDetails);
export default router;
