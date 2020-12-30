/**
 * Define all your API web-routes
 *
 */

import { Router } from "express";
import * as jwt from "jsonwebtoken";
import { packRules } from "@casl/ability/extra";
import { abilitiesforUser } from "../middlewares/Abilities";
import expressJwt from "express-jwt";
import { createValidator, ValidatedRequest } from "express-joi-validation";
import Locals from "../providers/Locals";
import LoginController from "../controllers/Api/Auth/Login";
import RegisterController from "../controllers/Api/Auth/Register";
import RefreshTokenController from "../controllers/Api/Auth/RefreshToken";
import ForgotController from "../controllers/Api/Auth/Forgot";
import ResetController from "../controllers/Api/Auth/Reset";
import VerifyController from "../controllers/Api/Auth/Verify";
import cookieParser from "cookie-parser";
import {
    RegistrationRequestSchema,
    BuisnessRegistrationRequestSchema,
} from "../interfaces/validators/register";
import RegistrationSchema from "../validators/Register";
import { LoginRequestSchema } from "../interfaces/validators/login";
import LoginSchema from "../validators/Login";
import { ForgotRequestSchema } from "../interfaces/validators/forgot";
import ForgotSchema from "../validators/Forgot";
import { ResetRequestSchema } from "../interfaces/validators/reset";
import ResetSchema from "../validators/Reset";

import { VerifyUserSchema } from "../interfaces/validators/verify";
import VerifySchema from "../validators/Verify";
import loggerFactory from "../middlewares/WinstonLogger";
import GoogleLogin from "../controllers/Api/Auth/passportStrategies";
import passport from "passport";
import { tokenToString } from "typescript";
import { profile } from "winston";
GoogleLogin.googleOAuth();
const router = Router();


const authValidator = createValidator({
    passError: true,
});

const servicename = "Auth";
router.post(
    "/login",
    authValidator.body(LoginSchema),
    (req: ValidatedRequest<LoginRequestSchema>, res) => {
        const methodname = "login";
        const logger = loggerFactory(servicename, methodname);
        logger.info(`Logging in User: ${req.body.email}`);
        LoginController.perform(req, res);
    }
);
router.post(
    "/register",
    authValidator.body(RegistrationSchema),
    (
        req: ValidatedRequest<
            RegistrationRequestSchema | BuisnessRegistrationRequestSchema
        >,
        res
    ) => {
        const methodname = "register";
        const logger = loggerFactory(servicename, methodname);
        logger.info(`Registering new user.`);
        RegisterController.perform(req, res);
    }
);
router.post(
    "/refresh-token",
    expressJwt({ secret: Locals.config().appSecret }),
    RefreshTokenController.perform
);
router.post(
    "/forgot",
    authValidator.body(ForgotSchema),
    (req: ValidatedRequest<ForgotRequestSchema>, res) => {
        ForgotController.perform(req, res);
    }
);
router.post(
    "/reset",
    authValidator.body(ResetSchema),
    (req: ValidatedRequest<ResetRequestSchema>, res) => {
        ResetController.perform(req, res);
    }
);

router.post(
    "/verify",
    authValidator.body(VerifySchema),
    (req: ValidatedRequest<VerifyUserSchema>, res) => {
        VerifyController.perform(req, res);
    }
);

router.get(
    "/google",
    cookieParser(), 
    passport.authenticate("google", {
        scope: ["profile", "email"],
        accessType : "offline",
    })
);
router.get("/google/redirect", 
cookieParser(),
 async (req, res, next) => {
await RegisterController.handleLoginOrRegistrationByOAuth(req, res, "google");
});

export default router;
