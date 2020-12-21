/**
 * Define interface for User Model
 *
 */

import { UserRoleEnum } from '../../../src/models/User';

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
    userType: number;
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

    organisationName?: string;
    organisationAddress?: string;
    noStudentsWithDisability?: string;
    role: UserRoleEnum;
    accessRequestSent?: boolean;
    statusLog?: Status[];
    deductCredits(amount: number, reason: string): void;
//    generateResetExpiryDate(): Date;
    // generateResetToken(_passwordResetExpires: Date): string;
}

export default IUser;
