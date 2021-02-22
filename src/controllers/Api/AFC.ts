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
import { calculateAfcEsclateCredits } from "../../utils/library";
import AfcRequestQueue from "../../queues/afcRequest";
import AfcResponseQueue from "../../queues/afcResponse";
import loggerFactory from "../../middlewares/WinstonLogger";
import { getFormattedJson } from "../../utils/formatter";
import emailService from "../../services/EmailService";
import {AfcModel} from "../../domain/AfcModel";
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
        const userId = res.locals.user.id;
        const totalCredits = await Credits.getUserCredits(userId);
        if (totalCredits > 0) {
            const afcData = await AfcModel.createAndPersist({
                // correlationId: `{${user.email}}[AFC][${Date.now()}]`,
                userId: userId,
                triggeredBy: AFCTriggerer.USER,
                documentName: req.body.documentName,
                tag: req.body.tag === "" ? undefined : req.body.tag,
                outputFormat: req.body.outputFormat,
                inputFileId: req.body.inputFileId,
                status: AFCRequestStatus.REQUEST_INITIATED,
                docType: req.body.docType,
                inputFileLink: req.body.inputFileLink,
            });

            const user = await UserModel.getUserById(userId);
            await user?.addUserTagIfDoesNotExist(afcData.tag);
            if (req.body.inputFileId) {
                const escalatedFile = await EscalationModel.checkForEscalatedFile(
                    req.body.inputFileId
                );
                if (escalatedFile !== null) {
                    logger.info(
                        `Escalated File found for source file: ${req.body.inputFileId} `
                    );
                    await afcData.changeStatusTo(
                        AFCRequestStatus.RESOLVED_FILE_USED
                    );
                    const file = await FileModel.getFileById(
                        req.body.inputFileId
                    );
                    if (file?.pages) {
                        await afcData.updateFormattingResults(
                            escalatedFile,
                            file.pages
                        );
                    }
                    const user = await UserModel.getUserById(userId);
                    if (user) {
                        AfcModel.afcRequestTransactionAndNotifyUser(
                            afcData,
                            afcData.pageCount || 0,
                            "Document accessibility conversion of file:" +
                                afcData.documentName,
                            user
                        );
                    }
                    return createResponse(
                        res,
                        HttpStatus.OK,
                        "Escalated File Used"
                    );
                }
                AfcRequestQueue.dispatch(afcData);
                logger.info("AFC request added successfully.");
            } else {
                return createResponse(
                    res,
                    HttpStatus.BAD_REQUEST,
                    `Input file is missing`
                );
            }
            return createResponse(res, HttpStatus.OK, "Afc Requested Accepted");
        } else {
            logger.error(`Insufficient credits`);
            return createResponse(
                res,
                HttpStatus.PAYMENT_REQUIRED,
                "Insufficient Credits"
            );
        }
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
        try {
            const afcRequest = await AfcModel.getAfcModelById(req.params.id);
            const sourceFile = await FileModel.getFileById(
                afcRequest?.inputFileId || ""
            );
            if (afcRequest !== null && sourceFile !== null) {
                const escalationRequest = new EscalationModel({
                    escalatorId: res.locals.user.id,
                    escalationForService: AIServiceCategory.AFC,
                    sourceFileId: afcRequest.inputFileId,
                    serviceRequestId: afcRequest.afcRequestId,
                    aiServiceConvertedFileURL: afcRequest.outputURL || "",
                    pageRanges: [req.body.escalatedPageRange],
                    escalatorOrganization: res.locals.user.organizationCode,
                    description: req.body.description,
                    status: EscalationStatus.UNASSIGNED,
                });
                escalationRequest.persist();
                await afcRequest.changeStatusTo(
                    AFCRequestStatus.ESCALATION_REQUESTED
                );
                let pageCount = calculateAfcEsclateCredits(
                    req.body.escalatedPageRange
                );
                logger.info(
                    `Deducting credits for AFC service used for page count ${pageCount}`
                );
                LedgerModel.createDebitTransaction(
                    res.locals.user.id,
                    pageCount * 100,
                    "Escalation request for file: " + afcRequest?.documentName
                );

                escalationRequest.notifyAFCResolvingTeam(
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

            logger.info(
                `${req.body.hash}, ${req.body.pages}, ${req.body.docType}`
            );
            if (
                req.body.json?.error ||
                (Object.keys(req.body.json).length <= 1 &&
                    req.body.json["0"].length === 0)
            ) {
                emailService.sendInternalDiagnosticEmail(
                    ExceptionTemplates.getOCRExceptionMessage({
                        code: 500,
                        reason: getFormattedJson(req.body),
                        correlationId: "to be implemented",
                        inputURL: file?.inputURL,
                        stackTrace:
                            "none, as the error in ocr API, please see logs of accommodation-automation repo",
                    })
                );

                if (FileModel.isMathDocType(req.body.docType)) {
                    file?.mathOcrWaitingQueue.forEach(async (requestId) => {
                        const afcRequest = await AfcModel.getAfcModelById(
                            requestId
                        );

                        if (afcRequest) {
                            const user = await UserModel.getUserById(
                                afcRequest?.userId
                            );
                            if (user) {
                                AfcModel.sendAfcFailureMessageToUser(
                                    user,
                                    afcRequest
                                );
                            }
                        }
                        await afcRequest?.changeStatusTo(
                            AFCRequestStatus.OCR_FAILED
                        );
                    });
                } else {
                    file?.ocrWaitingQueue.forEach(async (requestId) => {
                        const afcRequest = await AfcModel.getAfcModelById(
                            requestId
                        );

                        if (afcRequest) {
                            const user = await UserModel.getUserById(
                                afcRequest?.userId
                            );
                            if (user) {
                                AfcModel.sendAfcFailureMessageToUser(
                                    user,
                                    afcRequest
                                );
                            }
                        }
                        await afcRequest?.changeStatusTo(
                            AFCRequestStatus.OCR_FAILED
                        );
                    });
                }

                if (file) {
                    await new FileModel(file).clearWaitingQueue(
                        req.body.docType
                    );
                }
                return createResponse(res, HttpStatus.OK, "callback received");
            }
            await file?.updateOCRResults(
                req.body.hash,
                req.body.json,
                req.body.pages,
                req.body.docType
            );

            if (FileModel.isMathDocType(req.body.docType)) {
                file?.mathOcrWaitingQueue.forEach((afcRequestId) => {
                    AfcResponseQueue.dispatch({
                        fileId: file.fileId,
                        afcRequestId: afcRequestId,
                    });
                });
            } else {
                file?.ocrWaitingQueue.forEach((afcRequestId) => {
                    AfcResponseQueue.dispatch({
                        fileId: file.fileId,
                        afcRequestId: afcRequestId,
                    });
                });
            }
            logger.info("Clearing the waiting queue...");
            file?.clearWaitingQueue(req.body.docType);
        } catch (error) {
            logger.error("Error occurred: %o", error);

            return createResponse(
                res,
                HttpStatus.BAD_GATEWAY,
                "couldn't update file info"
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
}

export default AFCController;
