/**
 * Validator interface for Mentorship form
 *
 */

import { ContainerTypes, ValidatedRequestSchema } from 'express-joi-validation';

export interface MentorshipRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Body]: {
        industry: String,
        currentPosition: String,
        isPWD: Boolean,
        associatedDisabilities: String,
        signupAs: String,
        learnSkills: String,
        questionToMentor: String,
        anythingElseMentee: String,
        menteeAgreement: String,
        mentorSkills: String,
        connectOften: String,
        questionToMentee: String,
        anythingElseMentor: String,
        mentorshipStatus: String,
        mentorshipId: String,
        contactNumber: String
    };
}
