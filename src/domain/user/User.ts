import User, {
    IUserModel
} from "../../models/User";
    import {ServiceRoleEnum,
    UserRoleEnum,
    UserStatusEnum,
    FontThemes,
    ColorThemes
} from "./UserConstants";
import { UserCreationContext } from "./ContextPaths";
import { IUser, Tokens } from "../../interfaces/models/user";
import loggerFactory from "../../middlewares/WinstonLogger";
import LedgerModel from "../LedgerModel";
import { plainToClass } from "class-transformer";
import { doesListContainElement } from "../../utils/library";
import {OrganizationModel} from "../organization";
import {UniversityRoles} from "../organization/OrganizationConstants";
import {InvitedUserModel} from "../InvitedUserModel";
import {InvitedUserEnum, InvitationType} from "../InvitedUserModel/InvitedUserConstants";
import {
    InvalidInvitationTokenError,
    UserAlreadyRegisteredError,
    UserDomainErrors,
    UserInfoSaveError,
} from "./UserDomainErrors";
import EmailService from "../../services/EmailService";
import AuthMessageTemplates from "../../MessageTemplates/AuthTemplates";
import Locals from "../../providers/Locals";
import bcrypt from "bcrypt";
import {UserType, OAuthProvider, OtherUserRoles} from "./UserConstants";

export function getUserTypeFromString(userType: any): UserType {
    switch (userType) {
        case "I_STEM":
            return UserType.I_STEM;

        case "UNIVERSITY":
            return UserType.UNIVERSITY;

        case "BUSINESS":
            return UserType.BUSINESS;

        case "VOLUNTEER":
            return UserType.VOLUNTEER;

        case "ADMIN":
            return UserType.ADMIN;

        default:
            return UserType.I_STEM;
    }
}


export interface CardPreferences {
    showOnboardStaffCard: boolean;
    showOnboardStudentsCard: boolean;
}
export interface Themes {
    colorTheme: ColorThemes;
    fontTheme: FontThemes;
}
export interface UserPreferences {
    cardPreferences?: CardPreferences;
    themes?: Themes;
}

export interface UserModelProps {
    userId?: string;
    fullname: string;
    _id?: string;
    email: string;
    password?: string;
    accessRequestSent?: boolean;
    userType: UserType;
    role?: UserRoleEnum | UniversityRoles | OtherUserRoles;
    organizationName?: string;
    organizationCode: string;
    rollNumber?: string;
    serviceRole: ServiceRoleEnum;
    context?: UserCreationContext;
    isContextualized?: boolean;
    tags?: string[];
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    verifyUserToken?: string;
    verifyUserExpires?: Date;
    isVerified?: boolean;
    oauthProvider: OAuthProvider;
    oauthProviderId?: string;
    userPreferences?: UserPreferences;
}

class UserModel {
    static servicename = "UserDomainModel";

    fullname = "";
    userId = "";
    email = "";
    password = "";
    tokens: Tokens[] = [];
    userType: UserType;
    role: UserRoleEnum | UniversityRoles | OtherUserRoles;
    organizationName?: string;
    organizationCode: string;
    accessRequestSent = false;
    tags?: string[];
    rollNumber?: string = "";
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    verifyUserToken?: string;
    verifyUserExpires?: Date;
    isVerified?: boolean;
    showOnboardStudentsCard?: boolean;
    showOnboardStaffCard?: boolean;
    serviceRole: ServiceRoleEnum;
    userPreferences?: UserPreferences;
    oauthProvider: OAuthProvider;
    oauthProviderId?: string;
    //The context in which this user was created
    context?: UserCreationContext;
    isContextualized?: boolean;

    constructor(props: UserModelProps) {
        this.userId = props?.userId || props?._id || "";
        this.fullname = props?.fullname;
        this.email = props?.email;
        this.password = props.password || "";
        this.accessRequestSent = props?.accessRequestSent || false;
        this.userType = props.userType;
        this.role = props?.role || UserRoleEnum.USER;
        this.organizationCode = props.organizationCode;
        this.organizationName = props.organizationName;
        this.tags = props?.tags;
        this.rollNumber = props?.rollNumber || "";
        this.passwordResetToken = props.passwordResetToken;
        this.passwordResetExpires = props.passwordResetExpires;
        this.verifyUserToken = props.verifyUserToken;
        this.verifyUserExpires = props.verifyUserExpires;
        this.isVerified = props.isVerified;
        this.userPreferences = props.userPreferences;
        this.serviceRole = props.serviceRole;
        this.oauthProvider = props.oauthProvider;
        this.oauthProviderId = props.oauthProviderId;
        this.context = props.context;
        this.isContextualized = props.isContextualized;
    }

    public async persist() {
        const logger = loggerFactory(UserModel.servicename, "persist");

        try {
            const result = await new User(this).save();
this.userId = result.id;
            return this;
        } catch (error) {
            logger.error("couldn't persist user data: %o", error);
        }

        return null;
    }

    public async comparePassword(plainText: string): Promise<boolean> {
        return await bcrypt.compare(plainText, this.password);
    }
    public static async updateUniversityCardsForUser(
        userId: string,
        cardPreferences: CardPreferences,
        themes: Themes
    ) {
        const logger = loggerFactory(
            UserModel.servicename,
            "updateUniversityCardsForUser"
        );

        logger.info("Updating card preferences for user");
        try {
            await User.findByIdAndUpdate(userId, {
                $set: {
                    userPreferences: {
                        cardPreferences,
                        themes,
                    },
                },
            }).exec();
        } catch (error) {
            logger.error(
                "error encountered while updating university cards data: %o",
                error
            );
        }
    }

    public addUserTagIfDoesNotExist(tagName: string | undefined) {
        const logger = loggerFactory(UserModel.servicename, "addUserTag");

        if (tagName === undefined || tagName === "") {
            return;
        }
        try {
            logger.info("adding tag: " + tagName + "to tags: %o", this.tags);
            if (!doesListContainElement(this.tags, tagName)) {
                User.findByIdAndUpdate(this.userId, {
                    $push: {
                        tags: tagName,
                    },
                }).exec();
            }
        } catch (error) {
            logger.error("error encountered while updating tag: %o", error);
        }
    }

    public static async addOrganisationName(
        organisationName: string,
        userId: string
    ) {
        const logger = loggerFactory(
            UserModel.servicename,
            "addOrganisationName"
        );

        if (organisationName === undefined || organisationName === "") {
            return;
        }
        try {
            logger.info(
                "adding organisation name: " + organisationName + "to User: %o",
                userId
            );
            User.findByIdAndUpdate(userId, {
                organisationName: organisationName,
            }).exec();
        } catch (error) {
            logger.error(
                "error encountered while updating organisation name: %o",
                error
            );
        }
    }

    public async updateVerificationStatus(isVerified: boolean) {
        const logger = loggerFactory(
            UserModel.servicename,
            "updateVerificationStatus"
        );
        logger.info("updating verification status to: " + isVerified);
        await User.findByIdAndUpdate(this.userId, {
            isVerified: true,
        }).exec();
    }

    public static async getUserById(userId: string) {
        const logger = loggerFactory(UserModel.servicename, "getUserById");
        const user = await User.findById(userId).lean();
        if (user !== null) {
            return new UserModel(user);
        } else {
            logger.error("couldn't get user by id: " + userId);
        }

        return null;
    }

    public static async getUserByEmail(
        email: string
    ): Promise<UserModel | null> {
        const methodname = "getUserByEmail";
        const logger = loggerFactory(UserModel.servicename, methodname);

        let user: UserModel | null = null;
        try {
            const userInstance = await User.findOne({ email: email }).lean();
            if (userInstance === null) {
                throw Error(
                    "couldn't find user in database for email id: " + email
                );
            }
            user = new UserModel(userInstance);
        } catch (err) {
            logger.error(err);
        }

        return user;
    }

    public static async findUserByEmail(
        email: string
    ): Promise<UserModel | null> {
        const logger = loggerFactory(UserModel.servicename, "findUserByEmail");

        let user: UserModel | null = null;
        try {
            const userInstance = await User.findOne({ email: email }).lean();
            if (userInstance === null) {
                return null;
            }
            user = new UserModel(userInstance);
        } catch (err) {
            logger.error(err);
        }

        return user;
    }

    public async setIsContextualized(isContextualized: boolean) {
        const logger = loggerFactory(UserModel.name, "setIsContextualized");
        try {
            await User.findByIdAndUpdate(this.userId, { isContextualized });
        } catch (error) {
            logger.error("couldn't update isContextualized");
        }
    }

    public async getFirstTimeContext() {
        const contextPath =
            this.isContextualized === undefined ||
            this.isContextualized === true
                ? undefined
                : this.context;
        if (this.isContextualized !== true) this.setIsContextualized(true);
        return contextPath;
    }
    public async deductCredits(amount: number, reason: string) {
        const methodname = "deductCredits";
        const logger = loggerFactory(UserModel.servicename, methodname);
        await LedgerModel.createDebitTransaction(this.userId, amount, reason);
    }

    public static async updateAccessRequestStatus(
        email: string,
        status: boolean
    ): Promise<any> {
        const logger = loggerFactory(
            UserModel.servicename,
            "updateAccessRequestStatus"
        );
        let user: any = null;
        try {
            user = await User.findOneAndUpdate(
                { email },
                { accessRequestSent: status },
                { new: true }
            ).lean();
            if (user == null) {
                throw Error(
                    "Error updating the status of access request for user: " +
                        email
                );
            }
        } catch (err) {
            logger.error("Error occured", err);
        }
        return user?.accessRequestSent;
    }

    public async changeUserRole(
        role: UserRoleEnum | UniversityRoles
    ): Promise<any> {
        const logger = loggerFactory(UserModel.servicename, "changeUserRole");

        this.role = role;
        try {
            await User.findOneAndUpdate(
                {
                    email: this.email,
                },
                { role },
                { new: true }
            ).lean();
        } catch (err) {
            logger.error("Error occured", err);
        }
        return role;
    }

    public async changeUserServiceRole(
        serviceRole: ServiceRoleEnum
    ): Promise<any> {
        const logger = loggerFactory(
            UserModel.servicename,
            "changeUserServiceRole"
        );

        this.serviceRole = serviceRole;
        try {
            await User.findOneAndUpdate(
                {
                    email: this.email,
                },
                { serviceRole },
                { new: true }
            ).lean();
        } catch (err) {
            logger.error("Error occured", err);
        }
        return serviceRole;
    }

    public async updateUserOrganizationCode(
        organizationCode: string
    ): Promise<any> {
        const logger = loggerFactory(
            UserModel.servicename,
            "updateUserOrganizationCode"
        );

        this.organizationCode = organizationCode;
        try {
            await User.findOneAndUpdate(
                {
                    email: this.email,
                },
                { organizationCode },
                { new: true }
            ).lean();
        } catch (err) {
            logger.error("Error occured", err);
        }
        return organizationCode;
    }

    public static async updateUserStatusLog(
        email: string,
        status: UserStatusEnum
    ) {
        const logger = loggerFactory(
            UserModel.servicename,
            "updateUserStatusLog"
        );
        logger.info(`Updating user status log`);
        const user = await User.findOneAndUpdate(
            { email },
            { $push: { statusLog: { actionAt: new Date(), status } } }
        );
        if (user !== null) {
            logger.info(`User Status set successfully! `);
        } else {
            throw new Error(`Error updating the status log for user: `);
        }
    }

    public static generateOrganizationCodeFromUserTypeAndOrganizationName(
        userType: UserType,
        organizationName: string
    ): string {
        switch (userType) {
            case UserType.I_STEM:
            case UserType.VOLUNTEER:
                return UserType.I_STEM;

            case UserType.BUSINESS:
            case UserType.UNIVERSITY:
                return organizationName
                    ? organizationName.toUpperCase().replace(/\s/g, "_") +
                          "_" +
                          new Date().getTime()
                    : "";

            default:
                return "UNKNOWN";
        }
    }

    public static getDefaultUserRoleForUserType(userType: UserType) {
        switch (userType) {
            case UserType.I_STEM:
                return UniversityRoles.STUDENT;

            case UserType.UNIVERSITY:
            case UserType.BUSINESS:
                return UniversityRoles.STAFF;

            case UserType.VOLUNTEER:
                return OtherUserRoles.MENTOR;

            default:
                return OtherUserRoles.UNKNOWN;
        }
    }

    public static getDefaultServiceRoleForUser(
        userType: UserType
    ): ServiceRoleEnum {
        switch (userType) {
            case UserType.I_STEM:
                return ServiceRoleEnum.REGULAR;
            case UserType.UNIVERSITY:
                return ServiceRoleEnum.PREMIUM;
            case UserType.BUSINESS:
                return ServiceRoleEnum.PREMIUM;
            case UserType.VOLUNTEER:
                return ServiceRoleEnum.REGULAR;
            default:
                return ServiceRoleEnum.REGULAR;
        }
    }

    public static async getUserDetailsByOrganizationCodeAndRole(
        organizationCode: string,
        role: UniversityRoles | UserRoleEnum,
        offset: number,
        limit: number,
        searchString: string
    ) {
        return User.find({
            organizationCode,
            role,
            $or: [
                { fullname: new RegExp(searchString, "i") },
                { rollNumber: new RegExp(searchString, "i") },
            ],
        })
            .skip(offset)
            .limit(limit)
            .sort({ createdAt: 1 })
            .lean();
    }

    public static async getStudentDetailsByOrganizationCode(
        organizationCode: string
    ) {
        return User.find({
            organizationCode,
            role: UniversityRoles.STUDENT,
        })
            .sort({ createdAt: 1 })
            .lean();
    }

    public static async updateUserDetail(
        userId: string,
        props: Partial<UserModelProps>
    ) {
        const logger = loggerFactory(UserModel.servicename, "updateUserDetail");
        const user = await User.findByIdAndUpdate(
            userId,
            { ...props },
            { new: true }
        ).lean();
        if (user) {
            logger.info(`Update user data for user: ${userId}`);
            return user;
        } else {
            logger.error(`Error occured`);
            return null;
        }
    }

    public static async countStudentsInUniversityByUniversityCode(
        universityCode: string,
        searchString: string
    ): Promise<number> {
        const logger = loggerFactory(
            UserModel.servicename,
            "updateUsecountStudentsInUniversityByUniversityCoderDetail"
        );
        logger.info(
            `Fetching students count for university: ${universityCode}`
        );
        const count = User.countDocuments({
            organizationCode: universityCode,
            role: UniversityRoles.STUDENT,
            $or: [
                { fullname: new RegExp(searchString, "i") },
                { rollNumber: new RegExp(searchString, "i") },
            ],
        });
        return count;
    }

    public static async registerUser(
        props: UserModelProps,
        invitationToken: string | undefined,
        emailVerificationLink: string | undefined,
        invitationType: InvitationType
    ): Promise<UserModel | null> {
        const logger = loggerFactory(UserModel.servicename, "registerUser");

        const newUser = new UserModel(props);
        try {
            const existingUser = await UserModel.findUserByEmail(newUser.email);

            if (existingUser) {
                throw new UserAlreadyRegisteredError(
                    `User already exists for email: ${newUser.email}`
                );
            }

            const persistedUser = await newUser.persist();
            if (!persistedUser) {
                throw new UserInfoSaveError("couldn't save information");
            }

            if (invitationToken) {
                if (invitationType === InvitationType.FIRST_USER) {
                    await OrganizationModel.performUniversityAccountPreApprovalRequest(
                        persistedUser
                    );
                }
                await persistedUser?.updateDetailsForInvitedUser(
                    invitationToken
                );
            } else {
                if (props.oauthProvider === OAuthProvider.PASSWORD) {
                    await persistedUser?.createAccountEmailVerificationRequest(
                        emailVerificationLink || ""
                    );
                }
                persistedUser.associateUserWithOrganization();
            }

            if (
                invitationToken ||
                persistedUser.oauthProvider !== OAuthProvider.PASSWORD
            ) {
                await persistedUser.postAccountVerificationProcess();
            }
            return persistedUser;
        } catch (error) {
            logger.error("encountered error: " + error.name);
            throw error;
        }

        return null;
    }

    public async associateUserWithOrganization() {
        const logger = loggerFactory(
            UserModel.servicename,
            "associateUserWithOrganization"
        );
        const domainName = this.email.split("@")[1];
        const university = await OrganizationModel.findUniversityByDomainName(
            domainName
        );
        logger.info(`University: ${JSON.stringify(university)}`);

        if (university !== null) {
            logger.info(`Updating user details for university student`);
            UserModel.updateUserDetail(this.userId, {
                organizationCode: university.code,
                userType: UserType.UNIVERSITY,
                role: UniversityRoles.STUDENT,
                organizationName: university.name,
            });
        }
    }

    public async updateDetailsForInvitedUser(invitationToken: string) {
        const logger = loggerFactory(
            UserModel.servicename,
            "updateDetailsForInvitedUser"
        );

        const isUserValid = await InvitedUserModel.checkInvitedUser(
            this.email,
            invitationToken
        );

        if (isUserValid) {
            logger.info(`Adding invited user`);
            InvitedUserModel.updateStatus(
                this.email,
                InvitedUserEnum.REGISTERED
            );

            try {
                const invitedUserData = await InvitedUserModel.getInvitedUserByEmail(
                    this.email
                );
                if (invitedUserData) {
                    if (invitedUserData.role == UniversityRoles.STUDENT) {
                        this.changeUserRole(UniversityRoles.STUDENT);
                    } else {
                        this.changeUserRole(UniversityRoles.STAFF);
                    }
                    this.updateUserOrganizationCode(invitedUserData.university);
                    this.updateVerificationStatus(true);
                }
            } catch (err) {
                logger.error("Error occured: %o", err);
            }
        } else {
            logger.error(`Invalid email or verification token,`);
            throw new InvalidInvitationTokenError(
                `invalid token for user: ${this.email}`
            );
        }
    }

    public async createAccountEmailVerificationRequest(
        verificationLink: string
    ) {
        const logger = loggerFactory(
            UserModel.servicename,
            "createAccountEmailVerificationRequest"
        );

        const _verificationLink = `${verificationLink}?verifyToken=${
            this.verifyUserToken
        }&email=${encodeURIComponent(this.email)}`;
        logger.info(
            "generating email verification link with query param: " +
                _verificationLink
        );
        EmailService.sendEmailToUser(
            this,
            AuthMessageTemplates.getAccountEmailVerificationMessage({
                name: this.fullname,
                verificationLink: _verificationLink,
            })
        );
    }

    public async postAccountVerificationProcess() {
        const logger = loggerFactory(
            UserModel.servicename,
            "postAccountVerificationProcess"
        );
        LedgerModel.createCreditTransaction(
            this.userId,
            Locals.config().invitedUserCredits,
            "Successful verification"
        );
    }
}

export default UserModel;
