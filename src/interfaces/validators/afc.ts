/**
 * Validator interface for AFC(Alternate format conversion).
 *
 */

import { ContainerTypes, ValidatedRequestSchema } from 'express-joi-validation';

export interface AFCRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Body]: {
        documentName: String;
        tagId: String;
        outputFormat: Number;
        inputFileId: String;
        status: Number;
        escalatedPageRange: String;
        review: {
            rating: Number;
            text: String;
        }
    };
}
