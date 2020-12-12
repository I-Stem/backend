/**
 * Define interface for User Model
 *
 */

import { UniversityRoles } from "../../domain/UniversityModel";
import { ServiceRoleEnum, UserRoleEnum } from "../../../src/models/User";
import {OtherUserRoles, UserType} from "../../domain/User";


export interface Tokens {
    kind: string;
    accessToken: string;
    tokenSecret?: string;
}

export interface Status {
    status: string;
    actionAt: Date;
}

export interface IUser {
    fullname: string;
    gender?: string;
    email: string;
    password: string;
    isVerified: boolean;
    userType: UserType;
    verifyUserToken: string;
    verifyUserExpires: Date;

    tokens: Tokens[];
    steam?: string;

    passwordResetToken?: string;
    passwordResetExpires: Date;
    facebook?: string;
    twitter?: string;
    google?: string;
    github?: string;
    instagram?: string;
    linkedin?: string;

    geolocation?: string;
    website?: string;
    picture?: string;

    organizationName?: string;
    organisationAddress?: string;
    noStudentsWithDisability?: string;
    role: UserRoleEnum | UniversityRoles | OtherUserRoles;
    accessRequestSent?: boolean;
    statusLog?: Status[];
    organizationCode: string;
    deductCredits(amount: number, reason: string): void;
    rollNumber?: string;
    serviceRole: ServiceRoleEnum;
    //    generateResetExpiryDate(): Date;
    // generateResetToken(_passwordResetExpires: Date): string;
}

export default IUser;
