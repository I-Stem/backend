import User, {
    IUserModel,
    ServiceRoleEnum,
    UserRoleEnum,
    UserStatusEnum,
} from "../models/User";
import { IUser, Tokens } from "../interfaces/models/user";
import loggerFactory from "../middlewares/WinstonLogger";
import LedgerModel from "./LedgerModel";
import { plainToClass } from "class-transformer";
import { doesListContainElement } from "../utils/library";
import { UniversityRoles } from "./UniversityModel";

export enum UserType {
    I_STEM = "I_STEM",
    UNIVERSITY = "UNIVERSITY",
    BUSINESS = "BUSINESS",
    VOLUNTEER = "VOLUNTEER",
    ADMIN = "ADMIN",
}

export enum OtherUserRoles {
    MENTOR = "MENTOR",
    UNKNOWN = "UNKNOWN",
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
    tags?: string[];
    rollNumber?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    verifyUserToken?: string;
    verifyUserExpires?: Date;
    isVerified?: boolean;
    showOnboardStudentsCard?: boolean;
    showOnboardStaffCard?: boolean;
    serviceRole: ServiceRoleEnum;
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
        this.passwordResetToken = props.passwordResetToken;
        this.passwordResetExpires = props.passwordResetExpires;
        this.verifyUserToken = props.verifyUserToken;
        this.verifyUserExpires = props.verifyUserExpires;
        this.isVerified = props.isVerified;
        this.showOnboardStudentsCard = props.showOnboardStudentsCard;
        this.showOnboardStaffCard = props.showOnboardStaffCard;
        this.serviceRole = props.serviceRole;
    }

    public async persist() {
        const logger = loggerFactory(UserModel.servicename, "persist");

        try {
            const result = await new User(this).save();

            return new UserModel(result);
        } catch (error) {
            logger.error("couldn't persist user data: %o", error);
        }

        return null;
    }

    public static updateUniversityCardsForUser(userId: string, data: any) {
        const logger = loggerFactory(
            UserModel.servicename,
            "updateUniversityCardsForUser"
        );

        logger.info(`${data}, ${userId}`);
        try {
            User.findByIdAndUpdate(userId, data).exec();
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
        let methodname = "getUserByEmail";
        let logger = loggerFactory(UserModel.servicename, methodname);

        let user: UserModel | null = null;
        try {
            let userInstance = await User.findOne({ email: email }).lean();
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
        let logger = loggerFactory(UserModel.servicename, "findUserByEmail");

        let user: UserModel | null = null;
        try {
            let userInstance = await User.findOne({ email: email }).lean();
            if (userInstance === null) {
                return null;
            }
            user = new UserModel(userInstance);
        } catch (err) {
            logger.error(err);
        }

        return user;
    }

    public deductCredits(amount: number, reason: string): void {
        const methodname = "deductCredits";
        const logger = loggerFactory(UserModel.servicename, methodname);
        LedgerModel.createDebitTransaction(this.userId, amount, reason);
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
        role: UserRoleEnum | InvitedUserRole
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
        limit: number
    ) {
        return User.find({
            organizationCode,
            role: UniversityRoles.STUDENT,
        })
            .skip(offset)
            .limit(limit)
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
        universityCode: string
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
        });
        return count;
    }
}

export default UserModel;
