/**
 * Define interface for AFC(Alternate Format Conversion) Model
 *
 */

 import { HandleAccessibilityRequests } from "../../domain/organization/OrganizationConstants";
 import { AFCTriggerer } from "../../domain/AfcModel/AFCConstants";
 
 export interface Status {
     status: Number;
     actionAt: Date;
 }
 
 export interface IAFC {
     // correlationId: String;
     userId: String;
     triggeredBy?: AFCTriggerer;
     triggeringCaseId?: string;
     inputFileId: String;
     outputFileId: String;
     documentName: String;
     pageCount: Number;
     status: Number;
     statusLog: Status[];
     tagId: String;
     outputFormat: Number;
     otherRequests?: String;
     resultType?: HandleAccessibilityRequests;
 }
 
 export default IAFC;
 