import { Request, Response } from "express";
import { createResponse, response } from "../../../utils/response";
import loggerFactory from "../../../middlewares/WinstonLogger";
import * as HttpStatus from "http-status-codes";
import ValidateSchema from "../../../validators/StudentData";
import {InvitedUserModel, 
    InvitedUser,
    StudentDetail,
} from "../../../domain/InvitedUserModel";
import UniversityModel from "../../../domain/organization/OrganizationModel";
import {
    DomainAccessStatus,
    UniversityAccountStatus,
} from "../../../domain/organization";
import UserModel, { CardPreferences } from "../../../domain/user/User";
import emailService from "../../../services/EmailService";
import AuthMessageTemplates from "../../../MessageTemplates/AuthTemplates";
import {AdminReviewModel} from "../../../domain/AdminReviewModel";
import {
    AdminReviewStatus,
    ReviewEnum,
    ReviewRequestType,
} from "../../../domain/AdminReviewModel/AdminReviewConstants";

class UniversityController {
    static servicename = "University Controller";
    public static async index(req: Request, res: Response) {
        const methodname = "studentDataValidator";
        const logger = loggerFactory(
            UniversityController.servicename,
            methodname
        );
        try {
            logger.info(
                "using the organization code:  " +
                    res.locals.user.organizationCode
            );
            const searchString = req.query.searchString || "";

            const details = await UniversityModel.getStudentsByUniversityCode(
                res.locals.user.organizationCode,
                Number(req.query.limit),
                Number(req.query.offset),
                String(searchString)
            );
            if (details.length) {
                return createResponse(
                    res,
                    HttpStatus.OK,
                    "Student data retrieved successfully",
                    {
                        studentData: details,
                    }
                );
            } else {
                return createResponse(res, HttpStatus.OK, "No student data", {
                    studentData: [],
                });
            }
        } catch (err) {
            return createResponse(
                res,
                HttpStatus.BAD_REQUEST,
                "University not found",
                {}
            );
        }
    }

    public static async studentDetails(req: Request, res: Response) {
        const methodname = "studentDetails";
        const logger = loggerFactory(
            UniversityController.servicename,
            methodname
        );
        const studentId = req.query.studentId;
        try {
            const data = await UniversityModel.getStudentActivityByUserId(
                String(studentId)
            );
            return createResponse(res, HttpStatus.OK, "Success", data);
        } catch (err) {
            return createResponse(res, HttpStatus.BAD_REQUEST, "Failure", {});
        }
    }

    public static async getUniversityData(req: Request, res: Response) {
        const methodname = "getUniversityData";
        const logger = loggerFactory(
            UniversityController.servicename,
            methodname
        );
        try {
            const university = await UniversityModel.getUniversityByCode(
                res.locals.user.organizationCode
            );
            if (university) {
                return createResponse(
                    res,
                    HttpStatus.OK,
                    "Success",
                    university
                );
            } else {
                return createResponse(
                    res,
                    HttpStatus.NOT_FOUND,
                    "Success",
                    university
                );
            }
        } catch (err) {
            return createResponse(
                res,
                HttpStatus.BAD_REQUEST,
                "University not found",
                {}
            );
        }
    }

    public static async studentDataValidator(req: Request, res: Response) {
        const methodname = "studentDataValidator";
        const logger = loggerFactory(
            UniversityController.servicename,
            methodname
        );
        const data: StudentDetail[] = req.body;
        logger.info("student data: %o", data);
        const dataValidationError: any[] = [];
        data.map((val, index) => {
            const { error } = ValidateSchema.StudentSchema.validate(
                {
                    NAME: val.NAME,
                    EMAIL: val.EMAIL,
                    ROLL_NUMBER: val.ROLL_NUMBER
                        ? String(val.ROLL_NUMBER)
                        : null,
                },
                { abortEarly: false }
            );
            const fieldErrors = {};
            if (error?.message !== undefined) {
                error.details.map((e) => {
                    if (e.path[0] in fieldErrors)
                        fieldErrors[e.path[0]] = [
                            ...fieldErrors[e.path[0]],
                            e.message.replace(/[_]/g, " "),
                        ];
                    else {
                        fieldErrors[e.path[0]] = [
                            e.message.replace(/[_]/g, " "),
                        ];
                    }
                    if (index in dataValidationError) {
                        dataValidationError[index] = {
                            ...dataValidationError[index],
                            errors: fieldErrors,
                        };
                    } else {
                        dataValidationError.push({
                            row: index,
                            errors: fieldErrors,
                        });
                    }
                });
            }
        });
        logger.info(JSON.stringify(dataValidationError));
        return createResponse(res, HttpStatus.OK, "Success", {
            validationResult: dataValidationError,
        });
    }

    public static async addInvitedUsers(req: Request, res: Response) {
        const methodname = "addInvitedUsers";
        const logger = loggerFactory(
            UniversityController.servicename,
            methodname
        );
        const emails: Array<string> = req.body.emails;
        const university = req.body.organization;
        const userType = res.locals.user.userType;
        const fullNames: Array<string> = req.body.fullNames;
        const rollNos: Array<string> = req.body.rollNos;
        const role = req.body.role;
        const errors = emails.some(
            (email) =>
                ValidateSchema.emailSchema.validate({ email }).error
                    ?.message !== undefined
        );
        const data: InvitedUserModel[] = [];
        if (errors)
            return createResponse(
                res,
                HttpStatus.BAD_GATEWAY,
                "Error in emails"
            );
        const existingUsers: any[] = [];
        const newUsers: any[] = [];
        await Promise.all(
            emails.map(async (email: string, index: number) => {
                const user = await UserModel.findUserByEmail(email);
                const invitedUser = await InvitedUserModel.getInvitedUserByEmail(
                    email
                );
                if (user === null && invitedUser === null) {
                    let fullName = "";
                    let rollNumber = "";
                    if (fullNames[index]) {
                        fullName =
                            fullNames[index] !== null ? fullNames[index] : "";
                    }
                    if (rollNos[index]) {
                        rollNumber =
                            rollNos[index] !== null ? rollNos[index] : "";
                    }
                    data.push({
                        email: email,
                        university: university,
                        fullName: fullName,
                        rollNumber: rollNumber,
                        role: role,
                        userType: userType,
                    });
                    newUsers.push(email);
                    logger.info(`Data: ${JSON.stringify(data)}`);
                } else {
                    logger.info(
                        `User exist: ${user?.email}, ${invitedUser?.email}`
                    );
                    if (user) {
                        existingUsers.push(user?.email);
                    } else if (invitedUser) {
                        existingUsers.push(invitedUser?.email);
                    }
                }
            })
        );

        try {
            await InvitedUserModel.persistInvitedUser(data);
        } catch (err) {
            logger.error("error in adding user: %o", err);
            return createResponse(
                res,
                HttpStatus.BAD_REQUEST,
                "Error in persisting user data"
            );
        }
        logger.info(`Users: ${JSON.stringify(req.body)}`);
        return createResponse(res, HttpStatus.OK, "User data persisted", {
            newUsers,
            existingUsers,
        });
    }

    public static async registerUniversity(req: Request, res: Response) {
        const methodname = "registerUniversity";
        const logger = loggerFactory(
            UniversityController.servicename,
            methodname
        );
        logger.info("Request Received: %o", req.body);
        const universityInstance = new UniversityModel(req.body);

        try {
            await universityInstance.registerUniversity(
                req.body,
                res.locals.user.id
            );
        } catch (err) {
            return createResponse(
                res,
                HttpStatus.BAD_REQUEST,
                "Error in persisting University data"
            );
        }
        logger.info(`University: ${JSON.stringify(req.body)}`);
        return createResponse(
            res,
            HttpStatus.OK,
            "University data persisted",
            universityInstance
        );
    }

    public static async universitySettings(req: Request, res: Response) {
        const methodname = "universitySettings";
        const logger = loggerFactory(
            UniversityController.servicename,
            methodname
        );
        logger.info("Request Received: %o", req.body);
        const universityInstance = new UniversityModel(req.body);
        try {
            await universityInstance.updateUniversity(
                req.body,
                res.locals.user.id
            );
        } catch (err) {
            return createResponse(
                res,
                HttpStatus.BAD_REQUEST,
                "Error in persisting University settings data"
            );
        }
        logger.info(`University: ${JSON.stringify(req.body)}`);
        return createResponse(
            res,
            HttpStatus.OK,
            "University settings data persisted",
            universityInstance
        );
    }
    public static async universityMetrics(req: Request, res: Response) {
        const methodname = "universityMetrics";
        const logger = loggerFactory(
            UniversityController.servicename,
            methodname
        );
        logger.info("Request Received: %o", req.body);
        try {
            const metricsData = await UniversityModel.getMetricsByUniversityCode(
                res.locals.user.organizationCode
            );
            if (metricsData) {
                logger.info;
                return createResponse(
                    res,
                    HttpStatus.OK,
                    "Metrics data retrieved successfully",
                    metricsData
                );
            } else {
                return createResponse(res, HttpStatus.OK, "No metrics data", {
                    metricsData,
                });
            }
        } catch (err) {
            logger.error(`Error occured here for metrics data: ${err}`);
            return createResponse(
                res,
                HttpStatus.BAD_REQUEST,
                "University matrics data not found",
                {}
            );
        }
    }

    public static async handleRequest(req: Request, res, Response) {
        const logger = loggerFactory(
            UniversityController.servicename,
            "handleRequest"
        );

        logger.info("got organization code: " + req.params.organizationCode);
        try {
            const university = await UniversityModel.getUniversityByCode(
                req.params.organizationCode
            );
            const firstUser = await UserModel.getUserById(
                university.registeredByUser || ""
            );
            if (firstUser !== null) {
                if (req.params.action?.toUpperCase() === "APPROVED") {
                    await university.changeAccountStatusTo(
                        UniversityAccountStatus.APPROVED
                    );
                    await AdminReviewModel.getInstance({
                        requestType: ReviewRequestType.ORGANIZATION,
                        status: ReviewEnum.REVIEWED,
                        id: req.body.id,
                        reviewerId: res.locals.user.id,
                        adminReviewStatus: AdminReviewStatus.APPROVED,
                    }).updateStatus();
                    emailService.sendEmailToUser(
                        firstUser,
                        AuthMessageTemplates.getNewOrganizationRequestApprovalMessage(
                            {
                                name: firstUser?.fullname,
                                organizationName: firstUser?.organizationName,
                                userType: firstUser?.userType,
                            }
                        )
                    );
                } else if (req.params.action?.toUpperCase() === "REJECTED") {
                    university.changeAccountStatusTo(
                        UniversityAccountStatus.REJECTED
                    );
                    await AdminReviewModel.getInstance({
                        requestType: ReviewRequestType.ORGANIZATION,
                        status: ReviewEnum.REVIEWED,
                        id: req.body.id,
                        reviewerId: res.locals.user.id,
                        adminReviewStatus: AdminReviewStatus.REJECTED,
                    }).updateStatus();
                    emailService.sendEmailToUser(
                        firstUser,
                        AuthMessageTemplates.getNewOrganizationRegistrationRequestRejectionMessage(
                            {
                                name: firstUser?.fullname,
                                organizationName: firstUser?.organizationName,
                            }
                        )
                    );
                }
            } else {
                logger.error("couldn't find the user who created university");
            }
        } catch (error) {
            logger.error("encountered error: %o", error);
            return createResponse(
                res,
                HttpStatus.BAD_GATEWAY,
                "couldn't handle request"
            );
        }

        return createResponse(
            res,
            HttpStatus.OK,
            "successfully handled the request"
        );
    }

    public static updateUserCardsPreferences(req: Request, res: Response) {
        const logger = loggerFactory(
            UniversityController.servicename,
            "updateUniversityCards"
        );
        logger.info(
            `Card Preferences for user: ${req.body.showOnboardStaffCard}. ${req.body.showOnboardStudentsCard}`
        );
        const showOnboardStaffCard: boolean = req.body.showOnboardStaffCard;
        const showOnboardStudentsCard: boolean =
            req.body.showOnboardStudentsCard;
        const cardPrefernces: CardPreferences = {
            showOnboardStaffCard,
            showOnboardStudentsCard,
        };
        try {
            const user = UserModel.updateUniversityCardsForUser(
                res.locals.user.id,
                cardPrefernces
            );
            logger.info(user);
        } catch (error) {
            logger.error("Couldn't update univesity cards data");
            return createResponse(
                res,
                HttpStatus.BAD_GATEWAY,
                "Couldn't update univesity cards data"
            );
        }
        return createResponse(
            res,
            HttpStatus.OK,
            "successfully updated univesity cards data"
        );
    }

    public static async updateStudentDetails(req: Request, res: Response) {
        const logger = loggerFactory(
            UniversityController.servicename,
            "updateStudentDetails"
        );
        logger.info(
            `${req.body.userId}, ${req.body.email}, ${req.body.rollNumber}, ${req.body.fullname}`
        );
        const user = await UserModel.updateUserDetail(String(req.body.userId), {
            fullname: String(req.body.fullname),
            email: String(req.body.email),
            rollNumber: String(req.body.rollNumber),
        });
        if (user) {
            return createResponse(
                res,
                HttpStatus.OK,
                "Student Data updated successfully",
                {}
            );
        } else {
            return createResponse(
                res,
                HttpStatus.BAD_GATEWAY,
                "failed updating student data"
            );
        }
    }

    public static async studentsCount(req: Request, res: Response) {
        const logger = loggerFactory(
            UniversityController.servicename,
            "studentsCount"
        );
        logger.info(
            `student count for university: ${res.locals.user.organizationCode}`
        );
        const searchString = req.query.searchString || "";
        const count = await UserModel.countStudentsInUniversityByUniversityCode(
            String(res.locals.user.organizationCode),
            String(searchString)
        );
        return createResponse(
            res,
            HttpStatus.OK,
            "Students count in university",
            {
                count,
            }
        );
    }

    public static async downloadData(req: Request, res: Response) {
        const url = await UniversityModel.emailStudentDataForUniversityAsCsv(
            res.locals.user.organizationCode,
            res.locals.user.id
        );

        return createResponse(res, HttpStatus.OK, "Students data csv url", {
            url,
        });
    }

    public static async updateAutoDomainAccess(req: Request, res: Response) {
        if (req.params.action.toUpperCase() === "APPROVED") {
            UniversityModel.updateDomainAccessStatus(
                req.body.code,
                DomainAccessStatus.VERIFIED
            );
        } else if (req.params.action.toUpperCase() === "REJECTED") {
            UniversityModel.updateDomainAccessStatus(
                req.body.code,
                DomainAccessStatus.REJECTED
            );
        }
        await AdminReviewModel.getInstance({
            requestType: ReviewRequestType.AUTO_DOMAIN,
            status: ReviewEnum.REVIEWED,
            id: req.body.id,
            adminReviewStatus: (req.params
                .action as unknown) as AdminReviewStatus,
            reviewerId: res.locals.user.id,
        }).updateStatus();
        return createResponse(res, HttpStatus.OK, "Domain access updated");
    }
}

export default UniversityController;
