import EscalationMessageTemplates from "../../MessageTemplates/EscalationTemplates";
import emailService from "../../services/EmailService";
import { getFormattedJson } from "../../utils/formatter";
import loggerFactory from "../../middlewares/WinstonLogger";
import EscalationDbModel from "../../models/Escalation";
import {AfcModel} from "../AfcModel";
import { AFCRequestOutputFormat, AFCRequestStatus } from "../AfcModel/AFCConstants";
import FileModel, {FileCoordinate} from "../FileModel";
import UserModel from "../user/User";
import {VcModel} from "../VcModel";
import { VCRequestStatus, VideoExtractionType } from "../VcModel/VCConstants";
import AfcResponseQueue from "../../queues/afcResponse";
import User from "../../models/User";
import {OrganizationModel} from "../organization";
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
    waitingRequests: string[];
    resolverId?: string;
    escalationForService: AIServiceCategory;
    escalationForResult?: VideoExtractionType | AFCRequestOutputFormat;
    serviceRequestId: string;
    sourceFileId: string;
    sourceFileHash: string;
    aiServiceConvertedFile?: FileCoordinate;
    remediatedFile?: FileCoordinate;
    pageRanges?: string[];
    videoPortions?: string[];
    escalatorOrganization?: string;
    createdAt?: Date;
    description?: string;
    status: EscalationStatus;
    statusLog?: EscalationStatusLifeCycle[];
    docOutputFile?: FileCoordinate;
}

export class EscalationModel implements EscalationProps {
    static serviceName = "EscalationModel";

    escalationId?: string;
 waitingRequests: string[];
    resolverId?: string;
    escalationForService: AIServiceCategory = AIServiceCategory.NONE;
    escalationForResult?: VideoExtractionType | AFCRequestOutputFormat;
    serviceRequestId: string;
    sourceFileId: string;
    sourceFileHash: string;
    aiServiceConvertedFile?: FileCoordinate;
    remediatedFile?: FileCoordinate;
    pageRanges: string[] = [];
    videoPortions: string[] = [];
    escalatorOrganization?: string;
    createdAt?: Date;
    description?: string;
    status: EscalationStatus;
    statusLog?: EscalationStatusLifeCycle[];
    docOutputFile?: FileCoordinate;

    constructor(props: EscalationProps) {
        this.escalationId = props.escalationId || props._id || "";
        this.waitingRequests = props.waitingRequests;
        this.serviceRequestId = props.serviceRequestId;
        this.resolverId = props.resolverId;
        this.escalationForService = props.escalationForService;
        this.sourceFileId = props.sourceFileId;
        this.sourceFileHash = props.sourceFileHash;
        this.aiServiceConvertedFile = props.aiServiceConvertedFile;
        this.remediatedFile = props.remediatedFile;
        this.escalationForResult = props.escalationForResult;
        this.pageRanges = props.pageRanges || [];
        this.videoPortions = props.videoPortions || [];
        this.escalatorOrganization = props.escalatorOrganization;
        this.createdAt = props.createdAt;
        this.description = props.description;
        this.status = props.status;
        this.statusLog = props.statusLog;
        this.docOutputFile = props.docOutputFile;
    }

    public async persist() {
        const logger = loggerFactory(EscalationModel.serviceName, "persist");

        try {
            this.statusLog = [];
            this.statusLog.push(new EscalationStatusLifeCycle(this.status));
            logger.info(
                "Escalating file with sourceFileId" + this.sourceFileId
            );
            const remediationProcessInstance = await new EscalationDbModel(this).save();
            this.escalationId = remediationProcessInstance.id;
            return this;
        } catch (error) {
            logger.error("error occurred while persisting escalation request");
        }
    }

    public  async updateReimediatedFile(
        remediatedFile: FileCoordinate
    ) {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "updateReimediatedFile"
        );
this.remediatedFile = remediatedFile;
        const escalation = await EscalationDbModel.findByIdAndUpdate(
            this.escalationId,
            {
                remediatedFile: remediatedFile
            },
            { new: true }
        ).exec();
        }

        public async completePostRemediationProcessing(remediatedFileId: string) {
            const logger = loggerFactory(EscalationModel.serviceName, "completePostRemediationProcessing");
        try {
            const remediatedFile = await FileModel.getFileById(remediatedFileId);

            await this.updateReimediatedFile(new FileCoordinate(remediatedFile?.container || "", remediatedFile?.fileKey || "", remediatedFile?.fileId ));
remediatedFile?.setIsRemediatedFile(true);
            if (this.remediatedFile) {
                await this.completePendingRequests();
                await this.changeStatusTo(
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

    public static async findOrCreateRemediationProcess(props: EscalationProps) {
const logger = loggerFactory(EscalationModel.serviceName, "findOrCreateRemediationProcess");
try {
const result = await EscalationDbModel.findOne({
    sourceFileId: props.sourceFileId
});

if(result !== null) {
    await result.update({
        $push: {
            waitingRequests: props.waitingRequests[0]
        }
    })
    return new EscalationModel(result);
} else {
    return await new EscalationModel(props).persist();
}
} catch(error) {
    logger.error("error: %o", error);
    }
    }

    public static async getRemediationProcessById(remediationProcessId:string) {
const logger = loggerFactory(EscalationModel.serviceName, "getRemediationProcessById");
try {
const remediationProcess = await EscalationDbModel.findById(remediationProcessId);
if(remediationProcess !== null) {
    return new EscalationModel(remediationProcess);
}
else 
return null;
} catch(error) {
    logger.error("error: %o", error);
    }

    return null;
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
                return {
                    aiServiceConvertedFileURL:
                        escalation.aiServiceConvertedFile?.fileId,
                    pageRanges: escalation.pageRanges,
                    videoPortions: escalation.videoPortions,
                    resolverId: escalation.resolverId || "",
                    escalationForService: escalation.escalationForService,
                    escalationId: escalation._id,
                    documentName: file?.name,
                    sourceFileUrl: file?.getFileFullURL(),
                    description: escalation?.description || "",
                    docOutputFileUrl: escalation?.docOutputFile,
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

    public static async getEscalations(
        status: string | EscalationStatus,
        service: string | AIServiceCategory
    ): Promise<any[]> {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "getEscalations"
        );
        const escalationsData: any[] = [];
        try {
            const escalationsQuery = EscalationDbModel.find({
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
                const sourceFile = FileModel.getFileById(escalations[i].sourceFileId);
                try {
                    const user = await UserModel.getUserById(
                        escalations[i].resolverId || ""
                    );
                    if (user) resolverName = user?.fullname;
                } catch (err) {
                    resolverName = "";
                }
                escalationsData.push({
                    documentName: (await sourceFile)?.name,
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

            emailService.sendEscalationMessage(
                EscalationMessageTemplates.getRaiseAFCTicketMessage({
                    afcRequestDetails: getFormattedJson(afcRequest),
                    escalatorEmail: escalator.email,
                    escalatorId: escalator.userId,
                    escalatorName: escalator.fullname,
                    escalatorOrganization: escalator.organizationName || "",
                    pageRanges: escalatedPageRange,
                    inputFileURL: sourceFile.getFileFullURL()
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
                    escalatorEmail: escalator.email,
                    escalatorId: escalator.userId,
                    escalatorName: escalator.fullname,
                    escalatorOrganization: escalator.organizationName || "",
                    escalationOf: this.escalationForResult,
                    inputFileURL: sourceFile.getFileFullURL(),
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

    public async changeStatusTo(
        status: EscalationStatus
    ): Promise<any> {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "changeStatusTo"
        );
        logger.info(
            `Updating escalation status to ${status} for id: ${this.escalationId}`
        );
        this.status = status;
        this.statusLog?.push(new EscalationStatusLifeCycle(status));
        await EscalationDbModel.findByIdAndUpdate(this.escalationId, {
            status,
            $push: {
                statusLog: new EscalationStatusLifeCycle(status),
            },
        }).exec();
    }

    public static async getRemediationProcessDetailsBySourceFile(
        sourceFileId: string
    ): Promise<EscalationModel | null> {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "getRemediationProcessDetailsBySourceFile"
        );
        try {
            const result = await EscalationDbModel.findOne({ sourceFileId }).lean();

            if(result !== null)
            return new EscalationModel(result);
            else 
            return null;
        } catch (err) {
            logger.error("Error occured while finding source file %o" + err);
        }
        return null;
    }

    public async clearWaitingQueue() {
        const logger = loggerFactory(
            EscalationModel.serviceName,
            "clearWaitingQueue"
        );
        logger.info("clearing the waiting queue");
        this.waitingRequests.splice(0, this.waitingRequests.length);
        await EscalationDbModel.findByIdAndUpdate(this.escalationId, {
            waitingRequests: [],
        }).exec();
    }

    public async completePendingRequests() {
        const logger = loggerFactory(EscalationModel.serviceName, "completePendingRequests");

        const results = this.waitingRequests.map(async  ( serviceRequestId) => {
            if (
                this.escalationForService === AIServiceCategory.AFC
            ) {
                const afcRequest = await AfcModel.getAfcModelById(serviceRequestId);
                await afcRequest?.changeStatusTo(AFCRequestStatus.RESOLVED_FILE_USED);
                if(this.remediatedFile)
                                await afcRequest?.completeAFCRequestProcessing(this.remediatedFile);
            } else if (
                this.escalationForService === AIServiceCategory.VC
            ) {
                const vcRequest = await VcModel.getVCRequestById(serviceRequestId);
                if(this.remediatedFile)
await vcRequest?.performSuccessfulRequestCompletionPostActions(VCRequestStatus.RESOLVED_FILE_USED, this.remediatedFile);
            }
                    });

                    await Promise.all(results);
                    this.clearWaitingQueue();
    }
}

