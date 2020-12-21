/**
 * Define interface for registration validation
 *
 */

import { ContainerTypes, ValidatedRequestSchema } from 'express-joi-validation';

export interface RegistrationRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Body]: {
        email: String;
        verificationLink: String;
        password: String;
        fullname: String;
        userType: Number;
    };
}

export interface BuisnessRegistrationRequestSchema
    extends ValidatedRequestSchema {
    [ContainerTypes.Body]: {
        organisationName: String;
        organisationAddress: String;
        noStudentsWithDisability: String;
    };
}
