/**
 * Define Service API
 */
import * as HttpStatus from "http-status-codes";
import { Request, Response } from "express";
import { createResponse } from "../../utils/response";
import emailService from "../../services/EmailService";
import AuthTemplates from "../../MessageTemplates/AuthTemplates";
import loggerFactory from "../../middlewares/WinstonLogger";
import UserModel from "../../domain/user/User";
import ServiceRequestTemplates from "../../MessageTemplates/ServiceRequestTemplates";
import User, { ServiceRoleEnum, UserStatusEnum } from "../../models/User";
import AdminReviewModel, {
    AdminReviewStatus,
    ReviewEnum,
    ReviewRequestType,
} from "../../domain/AdminReviewModel";

export default class ServiceController {
    static serviceName = "Service Controller";
    /**
     * Api to send email to I-Stem to upgrade the user role
     *
     * @param req: HttpRequest
     * @param res: HttpResponse
     */
    public static async index(req: Request, res: Response): Promise<any> {
        const loggedInUser = res.locals.user;
        const logger = loggerFactory(ServiceController.serviceName, "index");
        logger.info(`user: ${loggedInUser.email}`);
        try {
            const user = await UserModel.getUserByEmail(loggedInUser.email);
            try {
                if (user) {
                    emailService.serviceUpgradeRequest(
                        AuthTemplates.getServiceUpgradeMessage({
                            user: user,
                            link: `${process.env.PORTAL_URL}/admin`,
                        })
                    );
                    await AdminReviewModel.getInstance({
                        requestType: ReviewRequestType.SERVICE,
                        status: ReviewEnum.REQUESTED,
                        serviceRoleRequest: {
                            role: ServiceRoleEnum.PREMIUM,
                            userId: user.userId,
                            fullName: user.fullname,
                            email: user.email,
                        },
                    }).persist();
                }
                try {
                    await UserModel.updateUserStatusLog(
                        loggedInUser.email,
                        UserStatusEnum.ROLE_UPGRADE_REQUEST_RECIEVED
                    );
                    logger.info(
                        `User status log: ${UserStatusEnum.ROLE_UPGRADE_REQUEST_RECIEVED}`
                    );
                } catch (err) {
                    logger.error(`Error occured updating log`);
                }
                try {
                    const status = await UserModel.updateAccessRequestStatus(
                        loggedInUser.email,
                        true
                    );

                    logger.info(
                        `Status for accessRequest: ${status} for user: ${loggedInUser.email}`
                    );
                } catch (err) {
                    logger.error(
                        `Error updating status of access request, ${err}`
                    );
                }
            } catch (err) {
                logger.error(`Email sending failed!`);
                return createResponse(
                    res,
                    HttpStatus.BAD_GATEWAY,
                    `Email sending failed!`
                );
            }
        } catch (err) {
            logger.info(`Error occured in finding the user by email`);
            return createResponse(
                res,
                HttpStatus.NOT_FOUND,
                `User not found`,
                err.message
            );
        }

        return createResponse(res, HttpStatus.OK, `Email sent successfully`);
    }

    /**
     * Api to upgrade the user role and confirmation email to user for service upgradation
     *
     * @param req: HttpRequest<{ email: string }, {}, { id: string }>
     * @param res: HttpResponse
     */
    public static async upgradeUser(
        req: Request<{ email: string }, {}, { id: string }>,
        res: Response
    ): Promise<any> {
        const logger = loggerFactory(
            ServiceController.serviceName,
            "upgradeUser"
        );
        logger.info(`user: ${req.params.email}`);
        const user = await UserModel.getUserByEmail(req.params.email);
        if (user !== null) {
            if (user.serviceRole === ServiceRoleEnum.PREMIUM) {
                logger.info(`User already upgraded: ${user.email}`);
                return createResponse(
                    res,
                    HttpStatus.OK,
                    `User Already Upgraded`,
                    {
                        serviceRole: user.serviceRole,
                    }
                );
            }
            try {
                const serviceRole = await user.changeUserServiceRole(
                    ServiceRoleEnum.PREMIUM
                );
                try {
                    await UserModel.updateUserStatusLog(
                        req.params.email,
                        UserStatusEnum.ROLE_UPGRADE_REQUEST_COMPLETE
                    );
                    logger.info(
                        `User status log: ${UserStatusEnum.ROLE_UPGRADE_REQUEST_COMPLETE}`
                    );
                    await AdminReviewModel.getInstance({
                        requestType: ReviewRequestType.SERVICE,
                        status: ReviewEnum.REVIEWED,
                        id: req.body.id,
                        adminReviewStatus: AdminReviewStatus.APPROVED,
                        reviewerId: res.locals.user.id,
                    }).updateStatus();
                } catch (err) {
                    logger.error(`Error occured updating log`);
                }
                try {
                    await emailService.sendEmailToUser(
                        user,
                        ServiceRequestTemplates.getAccessRequestComplete({
                            userName: user?.fullname,
                            userId: user?.userId,
                        })
                    );

                    try {
                        await UserModel.updateUserStatusLog(
                            req.params.email,
                            UserStatusEnum.ROLE_UPGRADE_REQUEST_MAIL_SENT
                        );
                        logger.info(
                            `User status log: ${UserStatusEnum.ROLE_UPGRADE_REQUEST_MAIL_SENT}`
                        );
                    } catch (err) {
                        logger.error(`Error occured updating log`);
                    }
                } catch (err) {
                    logger.error("Error occured while sending mail to user");
                }
                return createResponse(res, HttpStatus.OK, `User Upgraded`, {
                    serviceRole: serviceRole,
                });
            } catch (err) {
                logger.error(`Error occured in upgrading the role of user`);
                return createResponse(
                    res,
                    HttpStatus.BAD_GATEWAY,
                    `User upgrade failed`,
                    err
                );
            }
        }
    }

    public static async getAccessRequest(
        req: Request,
        res: Response
    ): Promise<any> {
        const logger = loggerFactory(
            ServiceController.serviceName,
            "getAccessRequest"
        );
        const loggedInUser = res.locals.user;
        logger.info(`user: ${loggedInUser.email}`);
        try {
            const user = await UserModel.getUserByEmail(loggedInUser.email);
            return createResponse(
                res,
                HttpStatus.OK,
                `Access Request data retrieved`,
                user?.accessRequestSent
            );
        } catch (err) {
            logger.info(`Error occured while fetching request access data`);
        }
    }
}
