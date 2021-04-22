/**
 * Define VC api
 *
 */

import { Request, Response } from "express";
import {getFormattedJson} from "../../utils/formatter";
import User, { IUserModel } from "../../models/User";
import { response, createResponse } from "../../utils/response";
import * as HttpStatus from "http-status-codes";
import VC, { IVCModel, IVCDocuement } from "../../models/VC";
import { AfCRequestQueue, VCRequestQueue } from "../../queues";
import File from "../../models/File";
import { MessageQueue } from "../../queues";
import Ledger from "../../models/Ledger";
import loggerFactory from "../../middlewares/WinstonLogger";
import MLModelModel, {
    TrainingInstance,
    TrainingStatus,
} from "../../domain/MLModelModel";
import {AfcModel} from "../../domain/AfcModel";
import {
    AFCRequestOutputFormat,
    AFCRequestStatus,
    AFCTriggerer,
    DocType,
} from "../../domain/AfcModel/AFCConstants";
import {AFCProcess} from "../../domain/AFCProcess";
import https from "https";
import FormData from "form-data";
import got from "got/dist/source";
import {VcModel, VCProps} from "../../domain/VcModel";
import { VCRequestStatus } from "../../domain/VcModel/VCConstants";
import FileModel from "../../domain/FileModel";
import LedgerModel from "../../domain/LedgerModel";
import UserModel from "../../domain/user/User";
import EmailService from "../../services/EmailService";
import FeedbackMessageTemplates from "../../MessageTemplates/FeedbackTemplates";
import {EscalationModel} from "../../domain/EscalationModel";
import {
    AIServiceCategory,
    EscalationStatus,
} from "../../domain/EscalationModel/EscalationConstants";
import VcResponseQueue from "../../queues/VcResponse";
import Credit from "../../domain/Credit";
import {OrganizationModel} from "../../domain/organization";
import {HandleAccessibilityRequests} from "../../domain/organization/OrganizationConstants";
import {VCLanguageModelType, VCProcess} from "../../domain/VCProcess";
import {VCProcessInsightExtractionError} from "../../domain/VCProcess/VCProcessErrors";

function mapVCRequestStatusToUIStatus(status: VCRequestStatus): number {
    const statusConversionMap = new Map([
        [VCRequestStatus.INITIATED, 1],
        [VCRequestStatus.CALLBACK_RECEIVED, 1],
        [VCRequestStatus.COMPLETED, 2],
        [VCRequestStatus.INDEXING_REQUESTED, 1],
        [VCRequestStatus.INDEXING_SKIPPED, 1],
        [VCRequestStatus.INDEXING_API_FAILED, 3],
        [VCRequestStatus.INDEXING_REQUEST_FAILED, 3],
        [VCRequestStatus.INSIGHT_FAILED, 3],
        [VCRequestStatus.INSIGHT_REQUESTED, 1],
        [VCRequestStatus.ESCALATION_REQUESTED, 4],
        [VCRequestStatus.ESCALATION_RESOLVED, 5],
        [VCRequestStatus.RETRY_REQUESTED, 6],
        [VCRequestStatus.RESOLVED_FILE_USED, 2],
    ]);

    return statusConversionMap.get(status) || 0;
}

class VCController {
    static servicename = "VCController";

    public static index(req: Request, res: Response) {
        const methodname = "index";
        const logger = loggerFactory(VCController.servicename, methodname);
        const loggedInUser = res.locals.user;
        User.findOne(
            { email: loggedInUser.email },
            (err: Error, user: IUserModel) => {
                if (err) {
                    logger.error(`Bad Request. ${err}`);
                    return res.status(HttpStatus.BAD_REQUEST).json(
                        response[HttpStatus.BAD_REQUEST]({
                            message: `Bad request please try again.`,
                        })
                    );
                }
                const _searchString = req.query.searchString || "";
                const resultsPerPage = 10;
                const page = parseInt((req.query.page as string) ?? "1");
                let query = req.query as any;
                const vcQuery = VC.find({
                    userId: user._id,
                    $or: [
                        {
                            documentName: new RegExp(
                                String(_searchString),
                                "i"
                            ),
                        },
                        { tag: new RegExp(String(_searchString), "i") },
                    ],
                });
                vcQuery
                    //.populate({
                    //path: 'tag',
                    //select: 'name slug'
                    //})
                    .sort({ updatedAt: -1 })
                    .select("-reviews")
                    .limit(resultsPerPage)
                    .skip(resultsPerPage * (page - 1))
                    .exec()
                    .then((results: any) => {
                        logger.info(`Video Captioning results retrieved`);
                        return createResponse(
                            res,
                            HttpStatus.OK,
                            `VC get call`,
                            results.map((result: any) => {
                                return {
                                    ...result.toJSON(),
                                    status: mapVCRequestStatusToUIStatus(
                                        result.status
                                    ),
                                    outputURL: result.outputURL?.startsWith("/")
                                        ? `${process.env.PORTAL_URL}${result.outputURL}`
                                        : result.outputURL,
                                };
                            })
                        );
                    })
                    .catch((err: any) => {
                        logger.error(`Internal Error occurred. ${err}`);
                        return createResponse(
                            res,
                            HttpStatus.BAD_GATEWAY,
                            `An internal server error occured ${err}`
                        );
                    });
            }
        );
    }

    public static async vcCount(req: Request, res: Response) {
        const logger = loggerFactory(VCController.servicename, "vcCount");
        logger.info(`vcCount count for User: ${res.locals.user}`);
        const count = await VC.countDocuments({
            userId: res.locals.user.id,
        }).exec();
        createResponse(res, HttpStatus.OK, "vcCount count for User", {
            count,
        });
    }

    public static async post(req: Request, res: Response) {
        const methodname = "post";
        const logger = loggerFactory(VCController.servicename, methodname);

        const userData = res.locals.user;
        const inputFilePromise = FileModel.getFileById(req.body.inputFileId);
        const totalCredits = await Credit.getUserCredits(userData.id);
        if (totalCredits > 0) {
            const inputFile = await inputFilePromise;
            const user = UserModel.getUserById(userData.id);
            const organization = OrganizationModel.getUniversityByCode(
                res.locals.user.organizationCode
            );
    
            const modelIdValue =
                req.body.modelId === "standard" ? undefined : req.body.modelId;
            const modelType =
                modelIdValue === undefined
                    ? VCLanguageModelType.STANDARD
                    : VCLanguageModelType.CUSTOM;
const secsForRemediation = req.body.videoPortions === "ALL" ? `1-${inputFile?.videoLength}` : req.body.videoPortions;
            const inputVCData: VCProps = {
                // correlationId: `{${user.email}}[VC][${Date.now()}]`,
                userId: userData.id,
                organizationCode: userData.organizationCode,
                documentName: req.body.documentName,
                tag: req.body.tag === "" ? undefined : req.body.tag,
                requestType: req.body.requestType,
                modelId: modelIdValue,
                outputFormat: req.body.outputFormat,
                inputFileId: req.body.inputFileId,
                status: VCRequestStatus.INITIATED,
                inputFileLink: inputFile?.inputURL || "",
                videoLength: inputFile?.videoLength || 0,
                otherRequests: req.body.otherRequests,
                resultType: req.body.resultType,
                secsForRemediation
            };

            if (inputFile?.isRemediated) {
                const remediationProcess = await EscalationModel.getRemediationProcessDetailsBySourceFile(
                    inputFile.fileId
                );

                if (remediationProcess !== null && remediationProcess.remediatedFile !== undefined) {
                    logger.info(
                        `Escalated File found for source file: ${req.body.inputFileId} `
                    );

                    inputVCData.escalationId = remediationProcess.escalationId;

                    const vcData = await new VcModel(inputVCData).persist();

                    vcData?.performSuccessfulRequestCompletionPostActions(
                        VCRequestStatus.RESOLVED_FILE_USED,
                        remediationProcess.remediatedFile
                    );
                }
            } else {
                const vcProcess = await VCProcess.findOrCreateVCProcess({
                    inputFileHash: inputFile?.hash || "",
                    inputFileId: inputFile?.fileId || "",
                    inputFileLink: inputFile?.inputURL,
                    insightAPIVersion: process.env.VC_API_VERSION || "",
                    languageModelId: modelIdValue,
                    languageModelType: modelType,
                    videoLength: inputFile?.videoLength,
                    expiryTime: VCProcess.getExpiryTime(
                        inputFile?.videoLength || 0
                    ),
                });

                inputVCData.associatedProcessId = vcProcess?.processId;

                const vcData = await new VcModel(inputVCData).persist();

                if (
                    req.body.inputFileId &&
                    vcData !== null &&
                    inputFile !== null &&
                    vcProcess !== undefined
                ) {
                    await vcData.initiateVCProcessForRequest(
                        vcProcess,
                        inputFile
                    );

                    logger.info("VC request added successfully.");
                    (await user)?.addUserTagIfDoesNotExist(vcData.tag);

                    if (
                        (await organization).handleAccessibilityRequests === HandleAccessibilityRequests.MANUAL ||
                            ((await organization).handleAccessibilityRequests === HandleAccessibilityRequests.ASK_USER  && req.body.resultType === HandleAccessibilityRequests.MANUAL)
                    ) {
                        const escalationRequest = await EscalationModel.findOrCreateRemediationProcess({
                            waitingRequests: [vcData.vcRequestId],
                            escalationForService: AIServiceCategory.VC,
                            escalationForResult: req.body.requestType,
                            sourceFileId: vcData.inputFileId,
                            sourceFileHash: inputFile.hash,
                            serviceRequestId: vcProcess.processId || "",
                            status: EscalationStatus.UNASSIGNED,
                            videoPortions: [secsForRemediation],
                            description: req.body.otherRequests,
                        });
                        await vcData.changeStatusTo(
                            VCRequestStatus.ESCALATION_REQUESTED
                        );
                        escalationRequest?.notifyVCResolvingTeam(
                            vcData,
                            inputFile
                        );
                    }
                } else {
                    return createResponse(
                        res,
                        HttpStatus.BAD_REQUEST,
                        `Input file is missing`
                    );
                }
            }
        } else {
            logger.error(`Insufficient credits`);
            return createResponse(
                res,
                HttpStatus.PAYMENT_REQUIRED,
                "Insufficient Credits"
            );
        }

        return createResponse(
            res,
            HttpStatus.OK,
            "request initiated successfully"
        );
    }

    public static async updateVcForFailedRequests(
        req: Request<{ id: string }>,
        res: Response
    ): Promise<any> {
        const methodname = "updateVcForFailedRequests";
        const logger = loggerFactory(VCController.servicename, methodname);
        logger.info(`Update VC for request: ${req.params.id}`);
        try {
            const vc = await VcModel.getVCRequestById(req.params.id);
            if (vc) {
                await vc.changeStatusTo(VCRequestStatus.RETRY_REQUESTED);
            }
        } catch (err) {
            return createResponse(
                res,
                HttpStatus.BAD_GATEWAY,
                "Internal server error"
            );
        }
        return createResponse(
            res,
            HttpStatus.OK,
            "successfullly updated VC request"
        );
    }

    public static async submitVCReview(req: Request, res: Response) {
        const logger = loggerFactory(
            VCController.servicename,
            "submitVCReview"
        );

        logger.info("review request: %o", req.body);

        const loggedInUser = res.locals.user;
        try {
            const data = await Promise.all([
                UserModel.getUserByEmail(loggedInUser.email),
                VcModel.saveReview(req.params.id, req.body.review),
            ]);

            logger.info(
                "response: %o, \n user: %o,\n file: ",
                data[0],
                data[1]
            );
            logger.info("input file id: " + data[1]?.inputFileId);
            const file = await FileModel.findFileById(
                data[1]?.inputFileId || ""
            );
            EmailService.reportCustomerFeedback(
                FeedbackMessageTemplates.getReviewMessage({
                    forService: "Video insights",
                    user: data[0],
                    reviews: data[1]?.reviews || [],
                    inputURL: file?.inputURL,
                    outputURL: data[1]?.outputURL || "",
                })
            );
        } catch (err) {
            logger.error(
                `Error occurred while updating VC review information. ${err}`
            );

            return createResponse(
                res,
                HttpStatus.BAD_GATEWAY,
                "couldn't update  the review"
            );
        }

        return createResponse(
            res,
            HttpStatus.OK,
            "successfully updated the review"
        );
    }

    public static async escalateRequest(req: Request, res: Response) {
        let methodname = "escalateRequest";
        let logger = loggerFactory(VCController.servicename, methodname);
        logger.info("received request for vc Escalation: %o", req.body);
        try {
            const vcRequest = await VcModel.getVCRequestById(req.params.id);
            const sourceFile = await FileModel.getFileById(
                vcRequest?.inputFileId || ""
            );
            if (vcRequest !== null && sourceFile !== null) {
                const escalationRequest = await EscalationModel.findOrCreateRemediationProcess({
                    waitingRequests: [vcRequest.vcRequestId],
                    escalationForService: AIServiceCategory.VC,
                    escalationForResult: req.body.requestType,
                    sourceFileId: vcRequest.inputFileId,
                    sourceFileHash: sourceFile.hash,
                    serviceRequestId: vcRequest.associatedProcessId || "",
                    aiServiceConvertedFile: vcRequest.outputFile ,
                    status: EscalationStatus.UNASSIGNED,
                });
                await vcRequest.changeStatusTo(
                    VCRequestStatus.ESCALATION_REQUESTED
                );

                escalationRequest?.notifyVCResolvingTeam(vcRequest, sourceFile);
            } else {
                logger.error("couldn't retrieve vc request id");
            }
        } catch (error) {
            logger.error(
                "Error occurred while creating escalation request for service id: " +
                    req.params.id +
                    " with error: %o",
                error
            );

            return createResponse(
                res,
                HttpStatus.BAD_GATEWAY,
                "Internal server error"
            );
        }
        return createResponse(
            res,
            HttpStatus.OK,
            "successfullly escalated request"
        );
    }

    public static async vcCallback(req: Request, res: Response) {
        const logger = loggerFactory(VCController.servicename, "vcCallback");
        logger.info(
            "callback received for external id: " +
                req.query.id +
                " with status: " +
                req.query.state
        );

        try {
            const vcProcess = await VCProcess.getVCProcessByExternalVideoId(
                req.query.id as string
            );
            vcProcess.changeStatusTo(VCRequestStatus.CALLBACK_RECEIVED);
            try {
                if (req.query.state?.toString().toLowerCase() !== "processed")
                    throw new VCProcessInsightExtractionError(
                        `Video Insight extraction processing failed for video ${req.query.id} as per callback input`
                    );

                vcProcess.retrieveVideoInsightResults();
            } catch (error) {
                logger.error("got error in vc callback: %o", error);
                vcProcess.notifyVCProcessFailure(
                    await FileModel.getFileById(vcProcess.inputFileId),
                    getFormattedJson(error),
                    500,
                    `callback processing for video id ${req.query.id} failed`,
                    getFormattedJson(error),
                    "unimplemented",
                    VCRequestStatus.INDEXING_API_FAILED
                );
            }
        } catch (error) {
            logger.error("error: %o", error);
            VCProcess.notifyErrorInVCProcessFlow(
                null,
                getFormattedJson(error),
                `couldn't process VC calback for ${req.query.id}`,
                getFormattedJson(error),
                "unimplemented",
                VCRequestStatus.INDEXING_API_FAILED
            );
        }
        return createResponse(res, HttpStatus.OK, "success");
    }

    public static async addCustomLanguageModel(req: Request, res: Response) {
        const logger = loggerFactory(
            VCController.servicename,
            "addCustomLanguageModel"
        );
        logger.info("got vc model creation request: %o", req.body);
        try {
            const loggedinUser = res.locals.user;

            let model = new MLModelModel({
                name: req.body.name,
                createdBy: loggedinUser.id,
            });

            const inputFile = await FileModel.getFileById(req.body.dataFileId);
            const afcProcess = await AFCProcess.findOrCreateAFCProcess({
                inputFileHash: inputFile?.hash || "",
                inputFileId: inputFile?.fileId || "",
                ocrType: DocType.NONMATH,
                ocrVersion: process.env.OCR_VERSION,
                pageCount: inputFile?.pages,
                expiryTime: AFCProcess.getExpiryTime(inputFile?.pages || 0),
            });

            const afcRequest = await AfcModel.createAndPersist({
                userId: loggedinUser.id,
                organizationCode: loggedinUser.organizationCode,
                associatedProcessId: afcProcess?.processId,
                inputFileId: req.body.dataFileId,
                outputFormat: AFCRequestOutputFormat.TEXT,
                documentName: req.body.name,
                triggeredBy: AFCTriggerer.VC_MODEL,
                status: AFCRequestStatus.REQUEST_INITIATED,
                docType: DocType.NONMATH,
                inputFileLink: inputFile?.inputURL,
                pageCount: inputFile?.pages,
            });

            model.trainings.push(
                new TrainingInstance(
                    TrainingStatus.CREATED,
                    new Map([[req.body.dataFileId, afcRequest.afcRequestId]])
                )
            );
            logger.info("model object: %o", model);
            model = await model.persist();

            afcRequest.updateTriggeringCaseId(model.modelId);
            if (afcProcess !== undefined && inputFile !== null)
                await afcRequest.initiateAFCProcessForRequest(
                    afcProcess,
                    inputFile
                );
        } catch (error) {
            logger.error(
                "encountered error in creating model training request: %o",
                error
            );
            return createResponse(
                res,
                HttpStatus.BAD_GATEWAY,
                "couldn't create request for model training"
            );
        }

        return createResponse(
            res,
            HttpStatus.OK,
            "model training started successfully"
        );
    }

    public static async getAllModelsOfUser(req: Request, res: Response) {
        const logger = loggerFactory(
            VCController.servicename,
            "getAllModelsOfUser"
        );

        try {
            const models = await MLModelModel.getAllUserModels(
                res.locals.user.id
            );

            const modelsData = models
                .filter((model) => model.trainedModelId)
                .map((model) => {
                    return {
                        modelId: model.modelId,
                        name: model.name,
                    };
                });
            logger.info("model list data: %o", modelsData);
            return createResponse(
                res,
                HttpStatus.OK,
                "retrieved models list",
                modelsData
            );
        } catch (error) {
            logger.error(
                "error occurred while retrieving user model list: %o",
                error
            );
            return createResponse(
                res,
                HttpStatus.BAD_GATEWAY,
                "couldn't get model list"
            );
        }
    }

    public static async fetchVcDetails(req: Request, res: Response) {
        try {
            const vcRequest = await VcModel.getVCRequestById(
                req.query.id as string
            );
            return createResponse(res, HttpStatus.OK, "vc details", {
                vcRequest,
            });
        } catch (err) {
            return createResponse(
                res,
                HttpStatus.BAD_GATEWAY,
                "error in fetching details"
            );
        }
    }
}

export default VCController;
