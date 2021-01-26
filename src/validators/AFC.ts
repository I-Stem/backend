/**
 * Defines validators for AFC(Alternate format conversion)
 *
 */

import * as Joi from '@hapi/joi';
import {AFCRequestOutputFormat} from "../domain/AfcModel";

const afcSchema = Joi.object({
    documentName: Joi.string(),
    tag: Joi.string().allow(''),
    outputFormat: Joi.string().allow(AFCRequestOutputFormat.WORD, AFCRequestOutputFormat.HTML, AFCRequestOutputFormat.PDF, AFCRequestOutputFormat.MP3, AFCRequestOutputFormat.TEXT).required(),
    inputFileId: Joi.string(),
    docType: Joi.string().required(),
    status: Joi.number().optional().min(0).max(5),
    escalatedPageRange: Joi.string().optional()
    .when('status', {
        is: 4,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    review: {
        rating: Joi.number(),
        text: Joi.string()
    },
    inputFileLink: Joi.string().optional()
});

export default afcSchema;
