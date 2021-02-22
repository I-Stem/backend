/**
 * Define all your API web-routes
 *
 */

import { Router } from "express";
import AuthRouter from "./Auth";
import TagRouter from "./Tag";
import AfcRouter from "./Afc";
import VcRouter from "./Vc";
import FileRouter from "./File";
import CreditRouter from "./Credit";
import CreditGameRouter from "./CreditGame";
import JobPreferencesRouter from "./JobPreferences";
import DisabilitiesRouter from "./Disabilities";
import IndustryRouter from "./Industry";
import ServiceRouter from "./Service";
import MentorshipRouter from "./Mentorship";
import SkillsRouter from "./Skills";
import WebinarRouter from "./Webinars";
import UniversityPortalRouter from "./Organization";
import HiringRouter from "./Hiring";
import UserRouter from "./User";
import EscalationRouter from "./Escalation";
import HackathonRouter from "./Hackathon";
import AdminRouter from "./Admin";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/afc", AfcRouter);
router.use("/v1/ocr", AfcRouter);
router.use("/tag", TagRouter);
router.use("/vc", VcRouter);
router.use("/credits", CreditRouter);
router.use("/file", FileRouter);
router.use("/game", CreditGameRouter);
router.use("/job", JobPreferencesRouter);
router.use("/disabilities", DisabilitiesRouter);
router.use("/industry", IndustryRouter);
router.use("/service", ServiceRouter);
router.use("/mentorship", MentorshipRouter);
router.use("/skills", SkillsRouter);
router.use("/webinars", WebinarRouter);
router.use("/service", ServiceRouter);
router.use("/university", UniversityPortalRouter);
router.use("/userInfo", UserRouter);
router.use("/escalation", EscalationRouter);
router.use("/hiring", HiringRouter);
router.use("/hackathon", HackathonRouter);
router.use("/admin", AdminRouter);

export default router;
