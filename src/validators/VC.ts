/**
 * Defines validators for VC(Video Captioning)
 *
 */

import * as Joi from '@hapi/joi';
import { join } from 'path';
import {VideoExtractionType, CaptionOutputFormat} from '../domain/VcModel/VCConstants';

const vcSchema = Joi.object({
    documentName: Joi.string().required(),
    requestType: Joi.string().allow(VideoExtractionType.CAPTION, VideoExtractionType.OCR, VideoExtractionType.OCR_CAPTION).required(),
    tag: Joi.string().allow(null, ''),
    status: Joi.number(),
    inputFileId: Joi.string().required(),
    modelId: Joi.string(),
    review: {
        rating: Joi.number(),
        text: Joi.string()
    },
    outputFormat: Joi.string().allow(CaptionOutputFormat.TXT, CaptionOutputFormat.SRT)
});

export default vcSchema;
