/**
 * Define interface for User Model
 *
 */

import { UniversityRoles } from "../../domain/organization/OrganizationModel";
import { ServiceRoleEnum, UserRoleEnum } from "../../../src/models/User";
import {OAuthProvider, OtherUserRoles, UserType, UserPreferences} from "../../domain/user";


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

    geolocation?: string;
    website?: string;
    picture?: string;

    organizationName?: string;
    organisationAddress?: string;
    role: UserRoleEnum | UniversityRoles | OtherUserRoles;
    accessRequestSent?: boolean;
    statusLog?: Status[];
    organizationCode: string;
    deductCredits(amount: number, reason: string): void;
    rollNumber?: string;
    serviceRole: ServiceRoleEnum;
    userPreferences: UserPreferences;
    oauthProvider: OAuthProvider;
    oauthProviderId: string;
    //    generateResetExpiryDate(): Date;
    // generateResetToken(_passwordResetExpires: Date): string;
}

export default IUser;
