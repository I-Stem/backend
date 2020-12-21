/**
 * Define interface for AFC(Alternate Format Conversion) Model
 *
 */

import { AFCTriggerer } from '../../domain/AfcModel';

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
}

export default IAFC;
