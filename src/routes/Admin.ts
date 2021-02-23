import { Router } from "express";
import AdminController from "../controllers/Api/Admin";

const router = Router();

router.get("/fetch", AdminController.allAdminRequests);
router.get("/count/pending", AdminController.countAllPendingRequests);
router.get("/count/reviewed", AdminController.countAllReviewedRequests);
router.get("/request", AdminController.getRequestDetails);
router.get("/reviews", AdminController.allReviewedRequests);
export default router;
