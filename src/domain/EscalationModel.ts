import EscalationMessageTemplates from '../MessageTemplates/EscalationTemplates';
import emailService from '../services/EmailService';
import { getFormattedJson } from '../utils/formatter';
import loggerFactory from '../middlewares/WinstonLogger';
import EscalationDbModel from '../models/Escalation';
import AfcModel, { AFCRequestOutputFormat } from './AfcModel';
import FileModel from './FileModel';
import UserModel from './User';
import VcModel, { VideoExtractionType } from './VcModel';
import AfcResponseQueue from '../queues/afcResponse';

export enum AIServiceCategory {
AFC = 'afc',
VC = 'vc',
NONE = 'none'
}

export interface EscalationProps {
    escalationId?: string;
    _id?: string;
escalatorId: string;
resolverId?: string;
escalationForService: AIServiceCategory;
escalationForResult?: VideoExtractionType | AFCRequestOutputFormat;
serviceRequestId: string;
    sourceFileId: string;
        aiServiceConvertedFileURL: string;
    remediatedFileURL?: string;
    pageRanges?: string[];
    videoPortions?: string[];
}

class EscalationModel {
static serviceName = 'EscalationModel';

    escalationId?: string;
    escalatorId: string;
    resolverId?: string;
    escalationForService: AIServiceCategory = AIServiceCategory.NONE;
    escalationForResult?: VideoExtractionType | AFCRequestOutputFormat;
    serviceRequestId: string;
    sourceFileId: string;
        aiServiceConvertedFileURL: string;
    remediatedFileURL?: string;
    pageRanges: string[] = [];
    videoPortions: string[] = [];

    constructor(props: EscalationProps) {
        this.escalationId = props.escalationId || props._id || '';
        this.escalatorId = props.escalatorId;
        this.serviceRequestId = props.serviceRequestId;
        this.resolverId = props.resolverId;
        this.escalationForService = props.escalationForService;
        this.sourceFileId = props.sourceFileId;
        this.aiServiceConvertedFileURL = props.aiServiceConvertedFileURL;
        this.remediatedFileURL = props.remediatedFileURL;
        this.escalationForResult = props.escalationForResult;
        this.pageRanges = props.pageRanges || [];
        this.videoPortions = props.videoPortions || [];
        }

        public async persist() {
const logger = loggerFactory(EscalationModel.serviceName, 'persist');

try {
    const escalation = await new EscalationDbModel(this).save();
    this.escalationId = escalation._id;
} catch (error) {
    logger.error('error occurred while persisting escalation request');
}
        }

        public async notifyAFCResolvingTeam(afcRequest: AfcModel, sourceFile: FileModel, escalatedPageRange: string) {
const logger = loggerFactory(EscalationModel.serviceName, 'notifyAFCResolvingTeam');
logger.info('sending email for escalation');
const escalator = await UserModel.getUserById(afcRequest.userId);

if (escalator !== null) {
let outputFileURL = afcRequest.outputURL;
    if(afcRequest.outputFormat !== AFCRequestOutputFormat.WORD) {
logger.info("creating docx output format for escalation resolving team" );
try {
const result = await AfcResponseQueue.requestFormatting(new AfcModel({...afcRequest, outputFormat: AFCRequestOutputFormat.WORD}), sourceFile);
outputFileURL = result.url
}
catch(error) {
    logger.error("couldn't create docx format");
}
    }
    delete sourceFile.json;
emailService.sendEscalationMessage(EscalationMessageTemplates.getRaiseAFCTicketMessage({
    afcRequestDetails: getFormattedJson(afcRequest),
    sourceFileDetails: getFormattedJson(sourceFile),
    escalatorEmail: escalator.email,
    escalatorId: escalator.userId,
    escalatorName: escalator.fullname,
    pageRanges: escalatedPageRange,
    inputFileURL: sourceFile.inputURL,
    docOutputFileURL: outputFileURL || ""
}));
} else {
logger.error('couldn\'t get escalator');
}
        }

        public async notifyVCResolvingTeam(vcRequest: VcModel, sourceFile: FileModel) {
            const logger = loggerFactory(EscalationModel.serviceName, 'notifyVCResolvingTeam');
            logger.info('sending email for escalation');
            const escalator = await UserModel.getUserById(vcRequest.userId);

            if (escalator !== null) {
            emailService.sendEscalationMessage(EscalationMessageTemplates.getRaiseVCTicketMessage({
                vcRequestDetails: getFormattedJson(vcRequest),
                sourceFileDetails: getFormattedJson(sourceFile),
                escalatorEmail: escalator.email,
                escalatorId: escalator.userId,
                escalatorName: escalator.fullname,
                escalationOf: this.escalationForResult,
                inputFileURL: sourceFile.inputURL,
                docOutputFileURL: vcRequest.outputURL || ""
            }));
            } else {
            logger.error('couldn\'t get escalator');
            }
                    }

    public static async getAfcEscalationCountForUser(userId: string): Promise<number> {
return EscalationDbModel.countDocuments({escalatorId: userId, escalationForService: AIServiceCategory.AFC}).exec();
    }

    public static async getVcEscalationCountForUser(userId: string): Promise<number> {
        return EscalationDbModel.countDocuments({escalatorId: userId, escalationForService: AIServiceCategory.VC}).exec();
            }

}

export default EscalationModel;
