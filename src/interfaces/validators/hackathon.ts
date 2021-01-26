/**
 * Validator interface for Hackathon.
 *
 */

import { ContainerTypes, ValidatedRequestSchema } from "express-joi-validation";

export interface HackathonRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Body]: {
        isPWD: Boolean;
        associatedDisabilities: String;
        designation: String;
        orgName: String;
        canCode: Boolean;
        anythingElse: String;
        expectations: String;
        preferedAreas: String;
    };
}
