/**
 * Validator interface for Job Preferences.
 *
 */

import { Bool } from 'aws-sdk/clients/clouddirectory';
import { ContainerTypes, ValidatedRequestSchema } from 'express-joi-validation';

export interface JobPreferencesRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Body]: {
        seekingJob: Boolean,
        natureOfJob: String,
        industry: String,
        idealPosition: String,
        highestEducation: String,
        highestDegree: String,
        major: String,
        workExperience: String,
        associatedDisabilities: String,
        currentPlace: String,
        canRelocate: Boolean,
        linkedIn: String,
        portfolioLink: String,
        resumeLink: String,
        needCareerHelp: Boolean,
        inputFileId: String
    };
}
