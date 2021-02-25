import EscalationMessageTemplates from "../../MessageTemplates/EscalationTemplates";
import emailService from "../../services/EmailService";
import { getFormattedJson } from "../../utils/formatter";
import loggerFactory from "../../middlewares/WinstonLogger";
import EscalationDbModel from "../../models/Escalation";
import {AfcModel} from "../AfcModel";
import { AFCRequestOutputFormat, AFCRequestStatus } from "../AfcModel/AFCConstants";
import FileModel from "../FileModel";
import UserModel from "../user/User";
import {VcModel} from "../VcModel";
import { VCRequestStatus, VideoExtractionType } from "../VcModel/VCConstants";
import AfcResponseQueue from "../../queues/afcResponse";
import User from "../../models/User";
import UniversityModel from "../organization/OrganizationModel";
import {AIServiceCategory, EscalationStatus} from "./EscalationConstants";

class EscalationStatusLifeCycle {
    status: EscalationStatus;
    actionAt: Date;
    constructor(status: EscalationStatus) {
        this.actionAt = new Date();
        this.status = status;
    }
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
    description?: string;
    status: EscalationStatus;
    statusLog?: EscalationStatusLifeCycle[];
    docOutputFileUrl?: string;
}

export class EscalationModel implements EscalationProps {
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
    description?: string;
    status: EscalationStatus;
    statusLog?: EscalationStatusLifeCycle[];
    docOutputFileUrl?: string;

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
        this.description = props.description;
        this.status = props.status;
        this.statusLog = props.statusLog;
        this.docOutputFileUrl = props.docOutputFileUrl;
    }

    public async persist() {
        const logger = loggerFactory(EscalationModel.serviceName, "persist");

        try {
            this.statusLog = [];
            this.statusLog.push(new EscalationStatusLifeCycle(this.status));
            logger.info(
                "Escalating file with sourceFileId" + this.sourceFileId
            );
            await new EscalationDbModel(this).save();
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
                },
                { new: true }
            ).exec();
            if (escalation?.remediatedFileURL) {
                if (
                    escalation?.escalationForService === AIServiceCategory.AFC
                ) {
                    await AfcModel.updateEscalatedAfcRequestWithRemediatedFile(
                        escalation.serviceRequestId,
                        escalation.remediatedFileURL
                    );
                    await AfcModel.updateAfcStatusById(
                        escalation.serviceRequestId,
                        AFCRequestStatus.ESCALATION_RESOLVED
                    );
                } else if (
                    escalation?.escalationForService === AIServiceCategory.VC
                ) {
                    await VcModel.updateEscalatedVcRequestWithRemediatedFile(
                        escalation.serviceRequestId,
                        escalation.remediatedFileURL
                    );
                    await VcModel.updateVcStatusById(
                        escalation.serviceRequestId,
                        VCRequestStatus.ESCALATION_RESOLVED
                    );
                }
                await EscalationModel.updateEscalationStatus(
                    escalation?.id,
                    EscalationStatus.RESOLVED
                );
            }
        } catch (error) {
            logger.error(
                `error occured while updating remediated file:" ${error}`
            );
        }
    }

    public static async updateResolver(escalationId: string, userId: string) {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "updateResolver"
        );
        try {
            await EscalationDbModel.findByIdAndUpdate(escalationId, {
                resolverId: userId,
                status: EscalationStatus.INPROGRESS,
                $push: {
                    statusLog: new EscalationStatusLifeCycle(
                        EscalationStatus.INPROGRESS
                    ),
                },
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
                let assignedOn: any = "";
                if (escalation.statusLog) {
                    escalation.statusLog.forEach((status) => {
                        if (status.status === EscalationStatus.INPROGRESS) {
                            assignedOn = status.actionAt;
                        }
                    });
                }
                let assignedTo: any;
                try {
                    const user = await UserModel.getUserById(
                        escalation?.resolverId || ""
                    );
                    assignedTo = user?.fullname;
                } catch (err) {
                    assignedTo = "";
                }
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
                    description: escalation?.description || "",
                    docOutputFileUrl: escalation?.docOutputFileUrl,
                    assignedOn,
                    assignedTo,
                };
            } else logger.error("couldn't find escalation by id: " + id);
        } catch (error) {
            logger.error(
                "Error occured while fetching escalation data: " + error
            );
        }
    }

    public static async getEscalationsByOrganization(
        escalatorOrganization: string,
        status: string | EscalationStatus,
        service: string | AIServiceCategory
    ): Promise<any[]> {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "getEscalationsByOrganization"
        );
        const escalationsData: any[] = [];
        try {
            const escalationsQuery = EscalationDbModel.find({
                escalatorOrganization,
            }).sort({ updatedAt: -1 });
            if (
                service.toUpperCase() === "ALL" &&
                status.toUpperCase() !== "ALL"
            ) {
                escalationsQuery.where("status").equals(status);
            } else if (
                (service.toUpperCase() === AIServiceCategory.AFC ||
                    service.toUpperCase() === AIServiceCategory.VC) &&
                status.toUpperCase() !== "ALL"
            ) {
                escalationsQuery
                    .where("escalationForService")
                    .equals(service)
                    .where("status")
                    .equals(status);
            } else if (
                status.toUpperCase() === "ALL" &&
                service.toUpperCase() !== "ALL"
            ) {
                escalationsQuery.where("escalationForService").equals(service);
            }
            const escalations = await escalationsQuery;

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
                const dataResolver = await Promise.all([request]);
                escalationsData.push({
                    documentName: dataResolver[0]?.documentName,
                    escalationId: escalations[i]._id,
                    resolverId: escalations[i].resolverId,
                    resolverName,
                    escaltionDate: escalations[i].createdAt,
                    pageRanges: escalations[i].pageRanges,
                    videoPortions: escalations[i].videoPortions,
                    escalationForService: escalations[i].escalationForService,
                    status: escalations[i].status,
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
            let docOutputFileUrl = afcRequest.outputURL;
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
                        sourceFile,
                        "escalation"
                    );
                    docOutputFileUrl = result.url;
                    await EscalationDbModel.findOneAndUpdate(
                        {
                            serviceRequestId: this.serviceRequestId,
                        },
                        {
                            $set: {
                                docOutputFileUrl,
                            },
                        }
                    );
                } catch (error) {
                    afcRequest.changeStatusTo(
                        AFCRequestStatus.ESCALATION_REQUESTED
                    );
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
                    docOutputFileURL: docOutputFileUrl || "",
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

    public static async updateEscalationStatus(
        escalationId: string,
        status: EscalationStatus
    ): Promise<any> {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "updateEscalationStatus"
        );
        logger.info(
            `Updating escalation status to ${status} for id: ${escalationId}`
        );
        await EscalationDbModel.findByIdAndUpdate(escalationId, {
            status,
            $push: {
                statusLog: new EscalationStatusLifeCycle(status),
            },
        }).exec();
    }

    public static async checkForEscalatedFile(
        sourceFileId: string
    ): Promise<string | null> {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "checkForEscalatedFile"
        );
        try {
            const result = await EscalationDbModel.findOne({ sourceFileId });
            if (result?.escalationForService === AIServiceCategory.AFC) {
                if (
                    result?.docOutputFileUrl !== undefined &&
                    result?.remediatedFileURL !== undefined
                ) {
                    return result.remediatedFileURL;
                }
            } else {
                if (result?.remediatedFileURL !== undefined) {
                    return result.remediatedFileURL;
                }
            }
        } catch (err) {
            logger.error("Error occured while finding source file %o" + err);
        }
        return null;
    }
}


