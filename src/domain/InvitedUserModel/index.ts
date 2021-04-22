import emailService from "../../services/EmailService";
import loggerFactory from "../../middlewares/WinstonLogger";
import InvitedUserDbModel from "../../models/InvitedUser";
import AuthMessageTemplates from "../../MessageTemplates/AuthTemplates";
import Locals from "../../providers/Locals";
import {OrganizationModel} from "../organization";
import { UserType } from "../user/UserConstants";
import {UniversityRoles} from "../organization/OrganizationConstants";
import {InvitedUserEnum, InvitationType} from "./InvitedUserConstants";

export interface StudentDetail {
    NAME: string | null;
    EMAIL: string | null;
    ROLL_NUMBER: string | null;
}

export interface StudentDetail {
    NAME: string | null;
    EMAIL: string | null;
    ROLL_NUMBER: string | null;
}

export interface InvitedUser {
    email: string;
    university: string;
    fullName?: string;
    verifyToken?: string;
    isRegistered?: boolean;
    statusLog?: { status: InvitedUserEnum; actionAt: Date }[];
    status?: InvitedUserEnum;
    _id?: string;
    userId?: string;
    rollNumber?: string;
    role: UniversityRoles;
    userType: UserType;
}

export class InvitedUserModel {
    static servicename = "InvitedUserModel";
    email: string;
    fullName: string;
    university: string;
    verifyToken: string;
    isRegistered: boolean;
    userId: string;
    rollNumber: string;
    role: UniversityRoles;
    userType: UserType;
status?: InvitedUserEnum;
statusLog: { status: InvitedUserEnum; actionAt: Date }[];

    constructor(props: InvitedUser) {
        this.email = props.email;
        this.fullName = props.fullName || "";
        this.university = props.university;
        this.verifyToken = props.verifyToken || "";
        this.isRegistered = props.isRegistered || false;
        this.userId = props.userId || props._id || "";
        this.rollNumber = props.rollNumber || "";
        this.role = props.role;
        this.userType = props.userType;
        this.status = props.status;
        this.statusLog = props.statusLog || [];
    }

    static async persistInvitedUser(
        userData: InvitedUser[],
        invitationType: InvitationType,
        organizationName?: string
    ) {
        const logger = loggerFactory(
            InvitedUserModel.servicename,
            "persistInvitedUser"
        );
        const user = await InvitedUserDbModel.insertMany(userData)
            .then((users) => {
                logger.info(`Invited User Data persisted, ${users}`);
                users.map((user) => {
                    const portalUrl = Locals.config().portalUrl;
                    if (portalUrl) {
                        const verificationLink = `${portalUrl}/register/student?email=${encodeURIComponent(
                            user.email
                        )}&verificationToken=${user.verifyToken}&userType=${
                            user.userType
                        }&invitationType=${invitationType}&userName=${
                            user.fullName
                        }`;
                        if (invitationType === InvitationType.ORGANIZATION) {
                            InvitedUserModel.sendEmailToUser(
                                verificationLink,
                                user
                            );
                        } else {
                            emailService.sendEmailToOrganization(
                                user.email,
                                AuthMessageTemplates.getNewOrganizationRequestApprovalMessage(
                                    {
                                        name: user.fullName || "",
                                        organizationName: organizationName,
                                        userType: user.userType,
                                        verificationLink: verificationLink,
                                    }
                                )
                            );
                        }
                        user.statusLog?.push({
                            status: InvitedUserEnum.INVITATION_SENT,
                            actionAt: new Date(),
                        });
                        user.status = InvitedUserEnum.INVITATION_SENT;
                        user.save();
                    }
                });
            })
            .catch((err) => {
                logger.error(`Error occured for persisting data, ${err}`);
                throw new Error(err);
            });
    }

    static async checkInvitedUser(email: string, verifyToken: string) {
        const logger = loggerFactory(
            InvitedUserModel.servicename,
            "checkInvitedUser"
        );
        let valid = false;
        try {
            const user = await InvitedUserDbModel.findOne({ email }).lean();

            if (
                user?.verifyToken === verifyToken &&
                user.isRegistered === false
            ) {
                logger.info("valid invited user: " + email);
                valid = true;
            }
        } catch (error) {
            logger.error("error: %o", error);
        }
        return valid;
    }

    static async getInvitedUserByEmail(email: string) {
        const logger = loggerFactory(
            InvitedUserModel.servicename,
            "getInvitedUserByEmail"
        );
        let user: InvitedUserModel | null = null;
        try {
            const userInstance = await InvitedUserDbModel.findOne({
                email,
            }).lean();
            if (userInstance === null) {
                return null;
            }
            user = new InvitedUserModel(userInstance);
        } catch (err) {
            logger.error(err);
        }
        return user;
    }

    static async updateStatus(email: string, status: InvitedUserEnum) {
        const logger = loggerFactory(
            InvitedUserModel.servicename,
            "updateStatus"
        );
        await InvitedUserDbModel.findOne({ email }, (err, user) => {
            if (err) {
                logger.error(`Error occured`);
                throw new Error(`Error occured, ${err}`);
            }
            if (user) {
                user.status = status;
                user.statusLog?.push({ status, actionAt: new Date() });
                if (status === InvitedUserEnum.REGISTERED) {
                    user.isRegistered = true;
                }
                user.save();
            }
        });
    }

    static async sendEmailToUser(verificationLink: string, user: InvitedUser) {
        const logger = loggerFactory(
            InvitedUserModel.servicename,
            "sendEmailToUser"
        );
        try {
            const university = await OrganizationModel.getUniversityByCode(
                user.university
            );
            emailService.sendEmailToInvitedUser(
                AuthMessageTemplates.getInvitedUserRegisterMessage({
                    link: verificationLink,
                    user: user,
                    universityName: university.name,
                }),
                user
            );
            logger.info(`Send mail to user: ${user.email}`);
        } catch (err) {
            throw new Error(`Error sending mail, ${err}`);
        }
    }
}

