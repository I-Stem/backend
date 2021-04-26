/**
 * Define interface for VC(Video Captioning) Model
 *
 */

 import { HandleAccessibilityRequests } from "../../domain/organization/OrganizationConstants";
 import { VCRequestStatus } from "../../domain/VcModel/VCConstants";
 
 export interface Status {
     status: Number;
     actionAt: Date;
 }
 
 export interface IVC {
     correlationId: String;
     userId: String;
     inputFileId: String;
     outputFileId: String;
     documentName: String;
     videoLength: Number;
     status: VCRequestStatus;
     statusLog: Status[];
     modelFileId: String;
     tagId: String;
     otherRequests?: String;
     resultType?: HandleAccessibilityRequests;
 }
 
 export default IVC;
 