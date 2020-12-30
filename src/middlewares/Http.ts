/**
 * Defines all the requisites in HTTP
 *
 */

import cors from "cors";
import { Application } from "express";
import compress from "compression";
import * as bodyParser from "body-parser";
import * as formidable from "express-formidable";

import loggerFactory from "./WinstonLogger";
import Locals from "../providers/Locals";
import passport from "passport";

class Http {
    static servicename = "Http";
    public static mount(_express: Application): Application {
        const methodname = "mount";
        const logger = loggerFactory(Http.servicename, methodname);
        logger.info("Booting the 'HTTP' middleware...");

        // Enables the request body parser
        _express.use(
            bodyParser.json({
                limit: Locals.config().maxUploadLimit,
            })
        );

        // _express.use(bodyParser.urlencoded({
        //     limit: Locals.config().maxUploadLimit,
        //     parameterLimit: Locals.config().maxParameterLimit,
        //     extended: false
        // }));

        // _express.use(formidable()); // default 200mb max size

        // Disable the x-powered-by header in response
        _express.disable("x-powered-by");

        // Enables the "gzip" / "deflate" compression for response
        _express.use(compress());
        _express.use(passport.initialize());

        return _express;
    }
}

export default Http;
