/**
 * Define User model
 *
 */

const bcrypt = require("bcrypt");

import { IUser } from "../interfaces/models/user";
import Ledger from "./Ledger";
import * as mongoose from "mongoose";
import * as crypto from "crypto";
import loggerFactory from "../middlewares/WinstonLogger";
import { OAuthProvider, OtherUserRoles, UserType } from "../domain/user/UserConstants";
import { UniversityRoles } from "../domain/organization";

const mongooseFuzzySearching = require("mongoose-fuzzy-searching");
const servicename = "User";
// Create the model schema & register your custom methods here
export interface IUserModel extends IUser, mongoose.Document {
    billingAddress(): string;
    comparePassword(password: string, cb: any): string;
    validPassword(password: string, cb: any): string;
    gravatar(_size: number): string;
    generateResetToken(_passwordResetExpires: Date): string;
    generateResetExpiryDate(): Date;
    generateVerifyToken(_verifyUserExpires: Date): string;
    generateVerifyExpiryDate(): Date;
    addCredits(_credits: number, _reason: string): void;
    deductCredits(_credits: number, _reason: string): void;
    getCredits(): Promise<any>;
    checkCredits(_credits: number): any;
    generatePassword(_requestPassword: string): string;
    currentStatus: string;
}

export enum UserRoleEnum {
    USER = "USER",
    ADMIN = "ADMIN",
}

export enum UserStatusEnum {
    USER_CREATED = "USER_CREATED",
    VERIFY_USER_MAIL_SENT = "VERIFY_USER_MAIL_SENT",
    USER_VERIFIED = "USER_VERIFIED",
    ROLE_UPGRADE_REQUEST_RECIEVED = "ROLE_UPGRADE_REQUEST_RECIEVED",
    ROLE_UPGRADE_REQUEST_MAIL_SENT = "ROLE_UPGRADE_REQUEST_MAIL_SENT",
    ROLE_UPGRADE_REQUEST_COMPLETE = "ROLE_UPGRADE_REQUEST_COMPLETE",
}

export const enum ServiceRoleEnum {
    REGULAR = "REGULAR",
    PREMIUM = "PREMIUM",
}

// Define the User Schema
export const UserSchema = new mongoose.Schema(
    {
        email: { type: String, unique: true, lowercase: true },
        password: { type: String },
        passwordResetToken: { type: String },
        passwordResetExpires: Date,
        role: {
            type: String,
            enum: [
                UserRoleEnum.USER,
                UserRoleEnum.ADMIN,
                UniversityRoles.STAFF,
                UniversityRoles.STUDENT,
                UniversityRoles.REMEDIATOR,
                OtherUserRoles.MENTOR,
                OtherUserRoles.UNKNOWN,
            ],
            required: true,
            default: UserRoleEnum.USER,
        },
        serviceRole: {
            type: String,
            enum: [ServiceRoleEnum.REGULAR, ServiceRoleEnum.PREMIUM],
            default: ServiceRoleEnum.REGULAR,
        },
        userType: {
            type: String,
            enum: [
                UserType.ADMIN,
                UserType.BUSINESS,
                UserType.I_STEM,
                UserType.UNIVERSITY,
                UserType.VOLUNTEER,
            ],
        },
        verifyUserToken: { type: String },
        verifyUserExpires: { type: Date },
        isVerified: { type: Boolean, default: false },
        userPreferences: {
            cardPreferences: {
                showOnboardStaffCard: { type: Boolean, default: true },
                showOnboardStudentsCard: { type: Boolean, default: true },
            },
            darkMode: { type: Boolean, default: false },
        },
        oauthProvider: {
            type: String,
            enum: [
                OAuthProvider.FACEBOOK,
                OAuthProvider.GITHUB,
                OAuthProvider.GOOGLE,
                OAuthProvider.TWITTER,
                OAuthProvider.PASSWORD,
            ],
            required: true,
            default: OAuthProvider.PASSWORD,
        },
        steam: { type: String },
        oauthProviderId: { type: String },
        context: { type: String },
        isContextualized: { type: Boolean, default: false },
        tokens: Array,
        organizationName: { type: String },
        organizationCode: { type: String },
        organisationAddress: { type: String },

        fullname: { type: String },
        gender: { type: String },
        geolocation: { type: String },
        website: { type: String },
        picture: { type: String },
        accessRequestSent: { type: Boolean, default: false },
        statusLog: [
            {
                status: {
                    type: String,
                    enum: Object.values(UserStatusEnum),
                    index: true,
                },
                actionAt: Date,
            },
        ],
        tags: [
            {
                type: String,
            },
        ],
        rollNumber: { type: String },
    },
    {
        id: true,
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);

// Password hash middleware
UserSchema.pre<IUserModel>("save", async function (_next) {
    if (!this.isModified("password")) {
        return _next();
    }

    const saltRounds = 10;
    let _verifyUserExpires = new Date();
    _verifyUserExpires = new Date(
        _verifyUserExpires.setDate(_verifyUserExpires.getDate() + 1)
    );
    const _verifyUserToken = crypto
        .createHash("sha1")
        .update(this.email + _verifyUserExpires.toString(), "utf8")
        .digest("hex");
    this.verifyUserToken = _verifyUserToken;
    this.verifyUserExpires = _verifyUserExpires;
    const hash = await bcrypt.hash(this.password, saltRounds);
    this.password = hash;
    return _next();
});

// Custom Methods
// Get user's full billing address
UserSchema.methods.billingAddress = function (): string {
    const methodname = "billingAddress";
    const logger = loggerFactory(servicename, methodname);

    const fulladdress = `${this.fullname.trim()} ${this.geolocation.trim()}`;
    logger.info(`Billing address: ${fulladdress}`);

    return fulladdress;
};

// create the user's password with the request password
UserSchema.methods.generatePassword = function (
    _requestPassword: string
): string {
    const saltRounds = 10;
    const hash = bcrypt.hashSync(_requestPassword, saltRounds);
    return hash;
};

// Compares the user's password with the request password
UserSchema.methods.comparePassword = function (
    _requestPassword: string,
    _cb: any
): any {
    bcrypt.compare(
        _requestPassword,
        this.password,
        (_err: any, _isMatch: boolean) => {
            return _cb(_err, _isMatch);
        }
    );
};

// User's gravatar
UserSchema.methods.gravatar = function (_size: number): any {
    if (!_size) {
        _size = 200;
    }

    const url = "https://gravatar.com/avatar";
    if (!this.email) {
        return `${url}/?s=${_size}&d=retro`;
    }

    const md5 = crypto.createHash("md5").update(this.email).digest("hex");
    return `${url}/${md5}?s=${_size}&d=retro`;
};

// Reset token generation
UserSchema.methods.generateResetToken = function (
    _passwordResetExpires: Date
): any {
    const _passwordResetToken = crypto
        .createHash("sha1")
        .update(this.email + _passwordResetExpires.toString(), "utf8")
        .digest("hex");
    return _passwordResetToken;
};

// Reset token expiry date
UserSchema.methods.generateResetExpiryDate = function () {
    let _passwordResetExpires = new Date();
    _passwordResetExpires = new Date(
        _passwordResetExpires.setHours(_passwordResetExpires.getHours() + 2)
    );
    return _passwordResetExpires;
};

UserSchema.methods.addCredits = function (
    _credits: number,
    _reason: string
): void {
    const methodname = "addCredits";
    const logger = loggerFactory(servicename, methodname);
    const transactionData = {
        userId: this._id,
        reason: _reason,
        credited: _credits,
        debited: 0,
    };
    new Ledger(transactionData).save((err: Error) => {
        if (err) {
            logger.error(err.message);
        } else {
            logger.info(`${_credits} added to account`);
        }
    });
};

UserSchema.methods.deductCredits = function (
    _credits: number,
    _reason: string
): void {
    const methodname = "deductCredits";
    const logger = loggerFactory(servicename, methodname);
    const transactionData = {
        userId: this._id,
        reason: _reason,
        debited: _credits,
        credited: 0,
    };
    new Ledger(transactionData).save((err: Error) => {
        if (err) {
            logger.error(err.message);
        } else {
            logger.info(`${_credits} deducted from account`);
        }
    });
};

// This function returns a promise which when resolved returns an array whose zeroth index
// contains the values of all credits and debits
UserSchema.methods.getCredits = function (): Promise<any> {
    const methodname = "getCredits";
    const logger = loggerFactory(servicename, methodname);
    return Ledger.aggregate([
        {
            $match: {
                userId: this._id,
            },
        },
        {
            $group: {
                _id: this._id,
                credits: {
                    $sum: "$credited",
                },
                debits: {
                    $sum: "$debited",
                },
            },
        },
    ])
        .exec()
        .then((result: any) => {
            return result[0].credits - result[0].debits;
        })
        .catch((err: any) => {
            logger.error(err.message);
            return -1;
        });
};

// This function returns a promise which when resolved returns an array whose zeroth index
// contains the condition checkCredits
UserSchema.methods.checkCredits = async function (
    _credits: number
): Promise<any> {
    const methodname = "checkCredits";
    const logger = loggerFactory(servicename, methodname);

    return await Ledger.aggregate([
        {
            $match: {
                userId: this._id,
            },
        },
        {
            $group: {
                _id: this._id,
                credits: {
                    $sum: "$credited",
                },
                debits: {
                    $sum: "$debited",
                },
            },
        },
        {
            $project: {
                checkCredits: {
                    $cond: [
                        {
                            $gte: [
                                { $subtract: ["$credits", "$debits"] },
                                _credits,
                            ],
                        },
                        true,
                        false,
                    ],
                },
            },
        },
    ]).exec();
};

UserSchema.virtual("currentStatus").get(function (this: { statusLog: [] }) {
    return this.statusLog[this.statusLog.length - 1];
});
UserSchema.plugin(mongooseFuzzySearching, {
    fields: ["fullName", "rollNumber"],
});

const User = mongoose.model<IUserModel>("User", UserSchema);

export default User;
