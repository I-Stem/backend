/**
 * Define interface for VC(Video Captioning) Model
 *
 */

import { VCRequestStatus } from 'src/domain/VcModel';

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
}

export default IVC;
