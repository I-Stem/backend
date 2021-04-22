/**
 * Define AFC api
 *
 */
import { Request, Response } from "express";
import User, { IUserModel } from "../../models/User";
import { createResponse, response } from "../../utils/response";
import * as HttpStatus from "http-status-codes";
import AFC from "../../models/AFC";
import File from "../../models/File";
import { calculateNumbersInRange} from "../../utils/library";
import AfcRequestQueue from "../../queues/afcRequest";
import AfcResponseQueue from "../../queues/afcResponse";
import loggerFactory from "../../middlewares/WinstonLogger";
import { getFormattedJson } from "../../utils/formatter";
import emailService from "../../services/EmailService";
import {AfcModel, AFCRequestProps} from "../../domain/AfcModel";
import {
    AFCRequestStatus,
    AFCTriggerer,
    DocType,
} from "../../domain/AfcModel/AFCConstants";
import UserModel from "../../domain/user/User";
import FileModel from "../../domain/FileModel";
import ExceptionTemplates from "../../MessageTemplates/ExceptionTemplates";
import FeedbackTemplates from "../../MessageTemplates/FeedbackTemplates";
import {EscalationModel} from "../../domain/EscalationModel";
import {
    AIServiceCategory,
    EscalationStatus,
} from "../../domain/EscalationModel/EscalationConstants";
import LedgerModel from "../../domain/LedgerModel";
import Credits from "../../domain/Credit";
import ServiceRequestTemplates from "../../MessageTemplates/ServiceRequestTemplates";
import { OrganizationModel } from "../../domain/organization";
import { HandleAccessibilityRequests} from "../../domain/organization/OrganizationConstants";
import {AFCProcess} from "../../domain/AFCProcess";
import {AFCProcessNotFoundError} from "../../domain/AFCProcess/AFCProcessErrors";

function mapAFCRequestStatusToUIStatus(status: AFCRequestStatus) {
    const statusMap = new Map([
        [AFCRequestStatus.REQUEST_INITIATED, 1],
        [AFCRequestStatus.OCR_REQUESTED, 1],
        [AFCRequestStatus.OCR_REQUEST_ACCEPTED, 1],
        [AFCRequestStatus.OCR_REQUEST_REJECTED, 3],
        [AFCRequestStatus.OCR_COMPLETED, 1],
        [AFCRequestStatus.OCR_SKIPPED, 1],
        [AFCRequestStatus.OCR_FAILED, 3],
        [AFCRequestStatus.FORMATTING_REQUESTED, 1],
        [AFCRequestStatus.FORMATTING_COMPLETED, 2],
        [AFCRequestStatus.FORMATTING_FAILED, 3],
        [AFCRequestStatus.ESCALATION_REQUESTED, 4],
        [AFCRequestStatus.ESCALATION_RESOLVED, 5],
        [AFCRequestStatus.RETRY_REQUESTED, 6],
        [AFCRequestStatus.RESOLVED_FILE_USED, 2],
    ]);

    return statusMap.get(status) || 1;
}

class AFCController {
    static servicename = "AFC Controller";

    public static index(req: Request, res: Response) {
        let methodname = "index";
        let logger = loggerFactory(AFCController.servicename, methodname);

        const loggedInUser = res.locals.user;
        User.findOne(
            { email: loggedInUser.email },
            (err: Error, user: IUserModel) => {
                if (err) {
                    logger.error(`Bad request. ${err}`);
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

                logger.info(
                    "Search string: %o and request query: %o",
                    _searchString,
                    req.query
                );

                const afcQuery = AFC.find({
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
                afcQuery
                    .where("triggeredBy")
                    .equals("user")
                    .sort({ updatedAt: -1 })
                    .select("-reviews")
                    .limit(resultsPerPage)
                    .skip(resultsPerPage * (page - 1))
                    .exec()
                    .then((results: Array<AfcModel>) => {
                        logger.info(`AFC get call.`);
                        return createResponse(
                            res,
                            HttpStatus.OK,
                            "retrieved afc requests",
                            results.map((result: any) => {
                                return {
                                    ...result.toJSON(),
                                    status: mapAFCRequestStatusToUIStatus(
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
                        logger.error(`Internal error occurred. ${err}`);
                        return createResponse(
                            res,
                            HttpStatus.BAD_GATEWAY,
                            "internal error in retrieving afc request list"
                        );
                    });
            }
        );
    }

    public static async afcCount(req: Request, res: Response) {
        const logger = loggerFactory(AFCController.servicename, "afcCount");
        logger.info(`afcCount count for User: ${res.locals.user}`);
        const _searchString = req.query.searchText || "";
        const count = await AFC.countDocuments({
            userId: res.locals.user.id,
            $or: [
                {
                    documentName: new RegExp(String(_searchString), "i"),
                },
                { tag: new RegExp(String(_searchString), "i") },
            ],
        }).exec();
        createResponse(res, HttpStatus.OK, "afcCount count for User", {
            count,
        });
    }

    public static async post(req: Request, res: Response) {
        let methodname = "post";
        let logger = loggerFactory(AFCController.servicename, methodname);
        logger.info("Posting AFC request: %o", req.body);
        const userData = res.locals.user;
        const totalCredits = await Credits.getUserCredits(userData.id);

        if (totalCredits > 0) {
            const inputFile = await FileModel.getFileById(req.body.inputFileId);
            const user = UserModel.getUserById(userData.id);
            const organization = OrganizationModel.getUniversityByCode(
                res.locals.user.organizationCode
            );
    const pagesForRemediation = req.body.escalatedPageRange === "ALL" ? `1-${inputFile?.pages}` : req.body.escalatedPageRange;
            const inputAfcData: AFCRequestProps = {
                // correlationId: `{${user.email}}[AFC][${Date.now()}]`,
                userId: userData.id,
                organizationCode: userData.organizationCode,
                triggeredBy: AFCTriggerer.USER,
                documentName: req.body.documentName,
                tag: req.body.tag === "" ? undefined : req.body.tag,
                outputFormat: req.body.outputFormat,
                inputFileId: req.body.inputFileId,
                status: AFCRequestStatus.REQUEST_INITIATED,
                docType: req.body.docType,
                inputFileLink: inputFile?.inputURL,
                pageCount: inputFile?.pages || 0,
                otherRequests: req.body.otherRequests,
                resultType: req.body.resultType,
                pagesForRemediation
            };

            if (inputFile?.isRemediated) {
                const remediationProcess = await EscalationModel.getRemediationProcessDetailsBySourceFile(
                    inputFile.fileId
                );

                if (remediationProcess !== null && remediationProcess.remediatedFile !== undefined) {
                    logger.info(
                        `Escalated File found for source file: ${req.body.inputFileId} `
                    );

                    inputAfcData.escalationId = remediationProcess.escalationId;

                    const afcData = await AfcModel.createAndPersist(
                        inputAfcData
                    );

                    await afcData.changeStatusTo(
                        AFCRequestStatus.RESOLVED_FILE_USED
                    );


                    afcData.completeAFCRequestProcessing(remediationProcess.remediatedFile);
                }
            } else {
                const afcProcess = await AFCProcess.findOrCreateAFCProcess({
                    inputFileHash: inputFile?.hash || "",
                    inputFileId: inputFile?.fileId || "",
                    ocrType: req.body.docType,
                    ocrVersion: process.env.OCR_VERSION,
                    pageCount: inputFile?.pages,
                    expiryTime: AFCProcess.getExpiryTime(inputFile?.pages || 0),
                });

                inputAfcData.associatedProcessId = afcProcess?.processId;

                const afcData = await AfcModel.createAndPersist(inputAfcData);
                if (
                    req.body.inputFileId &&
                    afcProcess !== undefined &&
                    inputFile !== null
                ) {
                    await afcData.initiateAFCProcessForRequest(
                        afcProcess,
                        inputFile
                    );

                    logger.info("AFC request added successfully.");
                    (await user)?.addUserTagIfDoesNotExist(afcData.tag);

                    if (
                        (await organization).handleAccessibilityRequests === HandleAccessibilityRequests.MANUAL || 
                        ((await organization).handleAccessibilityRequests === HandleAccessibilityRequests.ASK_USER
                            && req.body.resultType ===
                                HandleAccessibilityRequests.MANUAL)) {
                        const escalationRequest = await EscalationModel.findOrCreateRemediationProcess({
                            waitingRequests: [afcData.afcRequestId],
                            escalationForService: AIServiceCategory.AFC,
                            sourceFileId: afcData.inputFileId,
                            sourceFileHash: inputFile.hash,
                            serviceRequestId: afcProcess.processId || "",
                            pageRanges: [pagesForRemediation],
                            escalatorOrganization:
                                res.locals.user.organizationCode,
                            description: req.body.otherRequests,
                            status: EscalationStatus.UNASSIGNED,
                        });

                        afcData.changeStatusTo(AFCRequestStatus.ESCALATION_REQUESTED);
                        escalationRequest?.notifyAFCResolvingTeam(
                            afcData,
                            inputFile,
                            pagesForRemediation
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

        return createResponse(res, HttpStatus.OK, "Afc Requested Accepted");
    }

    public static async updateAfcForFailedRequests(
        req: Request<{ id: string }>,
        res: Response
    ): Promise<any> {
        const methodname = "updateAfcForFailedRequests";
        const logger = loggerFactory(AFCController.servicename, methodname);
        logger.info(`Update AFC request: ${req.params.id}`);
        try {
            const afc = await AfcModel.getAfcModelById(req.params.id);
            if (afc) {
                await afc.changeStatusTo(AFCRequestStatus.RETRY_REQUESTED);
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
            "successfullly updated Afc request"
        );
    }

    public static async escalateRequest(req: Request, res: Response) {
        let methodname = "escalateRequest";
        let logger = loggerFactory(AFCController.servicename, methodname);
        logger.info(
            `Escalation raised for ${req.params.id} for ${req.body.escalatedPageRange} page range`
        );
        try {
            const afcRequest = await AfcModel.getAfcModelById(req.params.id);
            const sourceFile = await FileModel.getFileById(
                afcRequest?.inputFileId || ""
            );
            if (afcRequest !== null && sourceFile !== null) {
                const escalationRequest = await EscalationModel.findOrCreateRemediationProcess({
                    waitingRequests: [afcRequest.afcRequestId],
                    escalationForService: AIServiceCategory.AFC,
                    sourceFileId: afcRequest.inputFileId,
                    sourceFileHash: sourceFile.hash,
                    serviceRequestId: afcRequest.associatedProcessId,
                    aiServiceConvertedFile: afcRequest.outputFile,
                    pageRanges: [req.body.escalatedPageRange],
                    escalatorOrganization: res.locals.user.organizationCode,
                    description: req.body.description,
                    status: EscalationStatus.UNASSIGNED,
                });
                await afcRequest.changeStatusTo(
                    AFCRequestStatus.ESCALATION_REQUESTED
                );
                escalationRequest?.notifyAFCResolvingTeam(
                    afcRequest,
                    sourceFile,
                    req.body.escalatedPageRange
                );
            } else {
                logger.error("couldn't retrieve afc request id");
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

    public static async afcCallback(req: Request, res: Response) {
        const logger = loggerFactory(AFCController.servicename, "afcCallback");
        logger.info("callback received for hash: " + req.body.hash);

        try {
            const file = await FileModel.getFileByHash(req.body.hash);
            const afcProcess = await AFCProcess.getAFCProcess(
                req.body.hash,
                req.body.docType,
                req.body.ocrVersion
            );

            logger.info(
                `${req.body.hash}, ${req.body.docType}, ${req.body.ocrVersion}`
            );

            try {
                if (
                    req.body.json?.error ||
                    (Object.keys(req.body.json).length <= 1 &&
                        req.body.json["0"].length === 0)
                ) {
                    afcProcess.notifyAFCProcessFailure(
                        file,
                        getFormattedJson(req.body),
                        "error in received callback",
                        "none, as the error in ocr API, please see logs of accommodation-automation repo",
                        "to be implemented",
                        AFCRequestStatus.OCR_FAILED
                    );

                    return createResponse(
                        res,
                        HttpStatus.OK,
                        "callback received"
                    );
                }

                if (file !== null && afcProcess !== null) {
                    await afcProcess.updateOCRResults(
                        req.body.hash,
                        req.body.json,
                        file
                    );

                    afcProcess.changeStatusTo(AFCRequestStatus.OCR_COMPLETED);
                    afcProcess.formatOutput();
                } else
                    throw new AFCProcessNotFoundError(
                        `couldn't get file ${req.body.hash} or afc process with params: ${req.body.docType}, ${req.body.ocrVersion} while executing afc callback`
                    );
            } catch (error) {
                logger.error("Error occurred: %o", error);

                afcProcess.notifyAFCProcessFailure(
                    file,
                    getFormattedJson(req.body),
                    "error while executing actions for received callback",
                    getFormattedJson(error),
                    "to be implemented",
                    AFCRequestStatus.OCR_FAILED
                );

                return createResponse(
                    res,
                    HttpStatus.BAD_GATEWAY,
                    "couldn't update file info"
                );
            }
        } catch (error) {
            logger.error("error: %o", error);

            AFCProcess.notifyErrorInAFCProcessFlow(
                null,
                "couldn't get file/afcprocess object",
                "couldn't get file/afcprocess object",
                getFormattedJson(error),
                "not yet",
                AFCRequestStatus.OCR_FAILED
            );
        }
        return createResponse(res, HttpStatus.OK, "callback executed");
    }

    public static async submitAFCReview(req: Request, res: Response) {
        const logger = loggerFactory(
            AFCController.servicename,
            "submitAFCReview"
        );

        logger.info("review request: %o", req.body);

        const loggedInUser = res.locals.user;
        try {
            const data = await Promise.all([
                UserModel.getUserByEmail(loggedInUser.email),
                AfcModel.saveReview(req.params.id, req.body.review),
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
            emailService.reportCustomerFeedback(
                FeedbackTemplates.getReviewMessage({
                    forService: "document accessibility",
                    user: data[0],
                    reviews: data[1]?.reviews || [],
                    inputURL: file?.inputURL,
                    outputURL: data[1]?.outputURL || "",
                })
            );
        } catch (err) {
            logger.error(
                `Error occurred while updating AFC information. ${err}`
            );

            return res.status(HttpStatus.BAD_GATEWAY).json(
                response[HttpStatus.BAD_GATEWAY]({
                    message: `An error occured while updating afc information.`,
                })
            );
        }

        return res.status(HttpStatus.OK).json(
            response[HttpStatus.OK]({
                message: "successfully added review",
            })
        );
    }

    public static async fetchAfcDetails(req: Request, res: Response) {
        const logger = loggerFactory(
            AFCController.servicename,
            "fetchAfcDetails"
        );
        try {
            const afcRequest = await AfcModel.getAfcModelById(
                req.query.id as string
            );
            return createResponse(res, HttpStatus.OK, "afc details", {
                afcRequest,
            });
        } catch (err) {
            logger.error(
                `Error occured while fetching Afc req, ${JSON.stringify(err)}`
            );
            return createResponse(
                res,
                HttpStatus.BAD_REQUEST,
                "failure in fettching request"
            );
        }
    }
}

export default AFCController;
