import { Router } from "express";
import UserInfo from "../controllers/Api/User";

const router = Router();
router.get("/", UserInfo.userDetails);

export default router;
