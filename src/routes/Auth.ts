/**
 * Define all your API web-routes
 *
 */

import { Router } from "express";
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
import PassportStrategies from "../controllers/Api/Auth/passportStrategies";
import passport from "passport";
import { getFormattedJson } from "../utils/formatter";

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

passport.use(PassportStrategies.getGoogleStrategy());

router.get(
    "/google",
    (req, res) => {
        passport.authenticate("google", {
            session: false,
            accessType: "offline",
            state: Buffer.from(JSON.stringify(req.query)).toString('base64')
        })(req, res);
            });

router.get("/google/redirect", 
async (req, res) => {
        passport.authenticate("google", {
        session: false,
        accessType: "offline"
    },
    await RegisterController.handleLoginOrRegistrationByOAuth(res)
    )(req, res);
});

export default router;