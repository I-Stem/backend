import EscalationMessageTemplates from "../MessageTemplates/EscalationTemplates";
import emailService from "../services/EmailService";
import { getFormattedJson } from "../utils/formatter";
import loggerFactory from "../middlewares/WinstonLogger";
import EscalationDbModel from "../models/Escalation";
import AfcModel, { AFCRequestOutputFormat } from "./AfcModel";
import FileModel from "./FileModel";
import UserModel from "./user/User";
import VcModel, { VideoExtractionType } from "./VcModel";
import AfcResponseQueue from "../queues/afcResponse";
import User from "../models/User";
import UniversityModel from "./UniversityModel";

export const enum AIServiceCategory {
    AFC = "afc",
    VC = "vc",
    NONE = "none",
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
    escalatorOrganization?: string;
    createdAt?: Date;
}

class EscalationModel {
    static serviceName = "EscalationModel";

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
    escalatorOrganization?: string;
    createdAt?: Date;

    constructor(props: EscalationProps) {
        this.escalationId = props.escalationId || props._id || "";
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
        this.escalatorOrganization = props.escalatorOrganization;
        this.createdAt = props.createdAt;
    }

    public async persist() {
        const logger = loggerFactory(EscalationModel.serviceName, "persist");

        try {
            const escalation = await new EscalationDbModel(this).save();
        } catch (error) {
            logger.error("error occurred while persisting escalation request");
        }
    }

    public static async updateReimediatedFile(
        escalationId: string,
        remediatedFileURL: any
    ) {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "updateResolver"
        );
        try {
            const escalation = await EscalationDbModel.findByIdAndUpdate(
                escalationId,
                {
                    remediatedFileURL,
                }
            ).exec();
            return escalation;
        } catch (error) {
            logger.error("error occured while updating resolver");
        }
    }

    public static updateResolver(escalationId: string, userId: string) {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "updateResolver"
        );
        try {
            EscalationDbModel.findByIdAndUpdate(escalationId, {
                resolverId: userId,
            }).exec();
        } catch (error) {
            logger.error("error occured while updating resolver");
        }
    }

    public static async getEscalationDetailsById(id: string) {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "getEscalationDetailsById"
        );
        try {
            const escalation = await EscalationDbModel.findById(id);

            if (escalation !== null) {
                const file = await FileModel.getFileById(
                    escalation.sourceFileId || ""
                );
                let request: any = "";
                if (escalation.escalationForService === AIServiceCategory.AFC) {
                    request = await AfcModel.getAfcModelById(
                        escalation.serviceRequestId
                    );
                } else {
                    request = await VcModel.getVCRequestById(
                        escalation.serviceRequestId
                    );
                }
                return {
                    aiServiceConvertedFileURL:
                        escalation.aiServiceConvertedFileURL,
                    pageRanges: escalation.pageRanges,
                    videoPortions: escalation.videoPortions,
                    resolverId: escalation.resolverId || "",
                    escalationForService: escalation.escalationForService,
                    escalationId: escalation._id,
                    documentName: request.documentName,
                    sourceFileUrl: file?.inputURL,
                };
            } else logger.error("couldn't find escalation by id: " + id);
        } catch (error) {
            logger.error(
                "Error occured while fetching escalation data: " + error
            );
        }
    }

    public static async getEscalationsByOrganization(
        escalatorOrganization: any
    ): Promise<any[]> {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "getEscalationsByOrganization"
        );
        const escalationsData: any[] = [];
        try {
            const escalations = await EscalationDbModel.find({
                escalatorOrganization,
            });
            for (let i = 0; i < escalations.length; ++i) {
                let resolverName = "";
                try {
                    const user = await UserModel.getUserById(
                        escalations[i].resolverId || ""
                    );
                    if (user) resolverName = user?.fullname;
                } catch (err) {
                    resolverName = "";
                }
                const sourceFile = FileModel.getFileById(
                    escalations[i].sourceFileId
                );
                let request: any;
                if (
                    escalations[i].escalationForService ===
                    AIServiceCategory.AFC
                ) {
                    request = AfcModel.getAfcModelById(
                        escalations[i].serviceRequestId
                    );
                } else {
                    request = VcModel.getVCRequestById(
                        escalations[i].serviceRequestId
                    );
                }
                const dataResolver = await Promise.all([request, sourceFile]);
                escalationsData.push({
                    documentName: dataResolver[0]?.documentName,
                    escalationId: escalations[i]._id,
                    resolverId: escalations[i].resolverId,
                    resolverName,
                    escaltionDate: escalations[i].createdAt,
                    pageRanges: escalations[i].pageRanges,
                    videoPortions: escalations[i].videoPortions,
                    escalationForService: escalations[i].escalationForService,
                    sourceFileUrl: dataResolver[1]?.inputURL,
                });
            }
        } catch (error) {
            logger.error(
                "error occurred while getting escalation for organization",
                error
            );
        }
        return escalationsData;
    }

    public static async notifyEscalator(escalationId: string) {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "notifyEscalator"
        );
        try {
            const escalation = await EscalationDbModel.findById(escalationId);

            if (escalation !== null) {
                const escalator = await UserModel.getUserById(
                    escalation.escalatorId
                );
                let request: any = "";
                if (escalation.escalationForService === AIServiceCategory.AFC) {
                    request = await AfcModel.getAfcModelById(
                        escalation.serviceRequestId
                    );
                } else {
                    request = await VcModel.getVCRequestById(
                        escalation.serviceRequestId
                    );
                }
                const sourceFile = await FileModel.getFileById(
                    escalation.sourceFileId || ""
                );
                emailService.sendEmailToEscalator(
                    EscalationMessageTemplates.getEsaclationResolved({
                        user: escalator,
                        escalationOf: escalation.escalationForService,
                        remediatedFileUrl: escalation.remediatedFileURL || "",
                        inputFileURL: sourceFile?.inputURL || "",
                        documentName: request.documentName,
                    }),
                    escalator
                );
            } else
                logger.error("couldn't find escalation by id: " + escalationId);
        } catch (error) {
            logger.error("Error occured while sending email.");
        }
    }

    public async notifyAFCResolvingTeam(
        afcRequest: AfcModel,
        sourceFile: FileModel,
        escalatedPageRange: string
    ) {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "notifyAFCResolvingTeam"
        );
        logger.info("sending email for escalation");
        const escalator = await UserModel.getUserById(afcRequest.userId);

        if (escalator !== null) {
            let outputFileURL = afcRequest.outputURL;
            if (afcRequest.outputFormat !== AFCRequestOutputFormat.WORD) {
                logger.info(
                    "creating docx output format for escalation resolving team"
                );
                try {
                    const result = await AfcResponseQueue.requestFormatting(
                        new AfcModel({
                            ...afcRequest,
                            outputFormat: AFCRequestOutputFormat.WORD,
                        }),
                        sourceFile
                    );
                    outputFileURL = result.url;
                } catch (error) {
                    logger.error("couldn't create docx format");
                }
            }
            delete sourceFile.json;
            emailService.sendEscalationMessage(
                EscalationMessageTemplates.getRaiseAFCTicketMessage({
                    afcRequestDetails: getFormattedJson(afcRequest),
                    sourceFileDetails: getFormattedJson(sourceFile),
                    escalatorEmail: escalator.email,
                    escalatorId: escalator.userId,
                    escalatorName: escalator.fullname,
                    pageRanges: escalatedPageRange,
                    inputFileURL: sourceFile.inputURL,
                    docOutputFileURL: outputFileURL || "",
                })
            );
        } else {
            logger.error("couldn't get escalator");
        }
    }

    public async notifyVCResolvingTeam(
        vcRequest: VcModel,
        sourceFile: FileModel
    ) {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "notifyVCResolvingTeam"
        );
        logger.info("sending email for escalation");
        const escalator = await UserModel.getUserById(vcRequest.userId);

        if (escalator !== null) {
            emailService.sendEscalationMessage(
                EscalationMessageTemplates.getRaiseVCTicketMessage({
                    vcRequestDetails: getFormattedJson(vcRequest),
                    sourceFileDetails: getFormattedJson(sourceFile),
                    escalatorEmail: escalator.email,
                    escalatorId: escalator.userId,
                    escalatorName: escalator.fullname,
                    escalationOf: this.escalationForResult,
                    inputFileURL: sourceFile.inputURL,
                    docOutputFileURL: vcRequest.outputURL || "",
                })
            );
        } else {
            logger.error("couldn't get escalator");
        }
    }

    public static async getAfcEscalationCountForUser(
        userId: string
    ): Promise<number> {
        return EscalationDbModel.countDocuments({
            escalatorId: userId,
            escalationForService: AIServiceCategory.AFC,
        }).exec();
    }

    public static async getVcEscalationCountForUser(
        userId: string
    ): Promise<number> {
        return EscalationDbModel.countDocuments({
            escalatorId: userId,
            escalationForService: AIServiceCategory.VC,
        }).exec();
    }
}

export default EscalationModel;
