/**
 * Validator interface for VC(Video Captioning).
 *
 */

 import { ContainerTypes, ValidatedRequestSchema } from "express-joi-validation";

 export interface VCRequestSchema extends ValidatedRequestSchema {
     [ContainerTypes.Body]: {
         documentName: String;
         tagId: String;
         inputFileId: String;
         outputFileId: String;
         status: Number;
         review: {
             rating: Number;
             text: String;
         };
         outputFormat: string;
         videoPortions: string;
         otherRequests: string;
         resultType: string;
     };
 }
 