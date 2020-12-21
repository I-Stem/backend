/**
 * Define VC api
 *
 */

import { Request, Response } from 'express';
import User, { IUserModel } from '../../models/User';
import { response, createResponse} from '../../utils/response';
import * as HttpStatus from 'http-status-codes';
import VC, { IVCModel, IVCDocuement } from '../../models/VC';
import { AfCRequestQueue, VCRequestQueue } from '../../queues';
import File from '../../models/File';
import { MessageQueue } from '../../queues';
import Ledger from '../../models/Ledger';
import loggerFactory from '../../middlewares/WinstonLogger';
import MLModelModel, { TrainingInstance, TrainingStatus } from '../../domain/MLModelModel';
import AfcModel, { AFCRequestOutputFormat, AFCRequestStatus, AFCTriggerer, DocType } from '../../domain/AfcModel';
import { AFC } from '@lip/models';
import https from 'https';
import FormData from 'form-data';
import got from 'got/dist/source';
import VcModel, { VCRequestStatus } from '../../domain/VcModel';
import FileModel from '../../domain/FileModel';
import LedgerModel from '../../domain/LedgerModel';
import UserModel from '../../domain/User';
import EmailService from '../../services/EmailService';
import FeedbackMessageTemplates from '../../MessageTemplates/FeedbackTemplates';
import EscalationModel,  {AIServiceCategory } from '../../domain/EscalationModel';
import VcResponseQueue from '../../queues/VcResponse';
import Credit from '../../domain/Credit';

function mapVCRequestStatusToUIStatus(status: VCRequestStatus): Number {
    const statusConversionMap = new Map([
        [VCRequestStatus.INITIATED, 1],
        [VCRequestStatus.CALLBACK_RECEIVED, 1],
        [VCRequestStatus.COMPLETED, 2],
        [VCRequestStatus.INDEXING_REQUESTED,  1],
        [VCRequestStatus.INDEXING_SKIPPED,  1],
        [VCRequestStatus.INDEXING_API_FAILED, 3],
        [VCRequestStatus.INDEXING_REQUEST_FAILED, 3],
        [VCRequestStatus.INSIGHT_FAILED, 3],
        [VCRequestStatus.INSIGHT_REQUESTED, 1],
        [VCRequestStatus.ESCALATION_REQUESTED, 4],
        [VCRequestStatus.ESCALATION_RESOLVED, 2]
    ]);

    return statusConversionMap.get(status) || 0;
}

class VCController {
    static servicename = 'VCController';

    public static index(req: Request, res: Response) {
        const methodname = 'index';
        const logger = loggerFactory(VCController.servicename, methodname);
        const loggedInUser = res.locals.user;
        User.findOne({ email: loggedInUser.email }, (err: Error, user: IUserModel) => {
            if (err) {
                logger.error(`Bad Request. ${err}`);
                return res.status(HttpStatus.BAD_REQUEST).json(
                    response[HttpStatus.BAD_REQUEST]({
                        message: `Bad request please try again.`
                    })
                );
            }
            const _searchString = req.query.searchString || '';
            const resultsPerPage = 10;
            const page = parseInt(req.query.page as string ?? '1');
            let query = req.query as any;
            let vcQuery;
            if (_searchString) {
                vcQuery = (VC as any).fuzzySearch(_searchString, { userId: user?._id });
            } else {
                vcQuery = VC.find({ userId: user._id });
            }
            vcQuery
                //.populate({
                    //path: 'tag',
                    //select: 'name slug'
                //})
                .sort({ updatedAt: -1 })
                .select('-reviews')
                .limit(resultsPerPage)
                .skip(resultsPerPage * (page - 1))
                .exec()
                .then((results: any) => {
                    logger.info(`Video Captioning results retrieved`);
                    return createResponse(res, HttpStatus.OK, `VC get call`,   results.map((result: any) => {
                                 return {
                                     ...result.toJSON(),
                                     status: mapVCRequestStatusToUIStatus(result.status)
                                 };
                            }));
                })
                .catch((err: any) => {
                    logger.error(`Internal Error occurred. ${err}`);
                    return createResponse(res, HttpStatus.BAD_GATEWAY, `An internal server error occured ${err}`);
                });
            });
    }
    public static async post(req: Request, res: Response) {
        const methodname = 'post';
        const logger = loggerFactory(VCController.servicename, methodname);

        const loggedInUser = res.locals.user;
        const totalCredits =  await Credit.getUserCredits(loggedInUser.id);
        if (totalCredits > 0) {
            const vcData = new VcModel({
                userId: loggedInUser.id,
                requestType: req.body.requestType,
                documentName: req.body.documentName,
                tag: req.body.tag === '' ? undefined : req.body.tag,
                modelId: req.body.modelId === 'standard' ? undefined : req.body.modelId,
                inputFileId: req.body.inputFileId,
                status: VCRequestStatus.INITIATED,
                outputFormat: req.body.outputFormat
            });

            const user = await UserModel.getUserById(loggedInUser.id);
            await user?.addUserTagIfDoesNotExist(vcData.tag);

            if (! await vcData.persist()) {
                return createResponse(res, HttpStatus.BAD_GATEWAY, 'Persistence layer is failing');
            }

            logger.info('Dispatching request to VC Request Queue. %o', vcData);
            VCRequestQueue.dispatch(vcData);

            logger.info('VC added successfully');
            return createResponse(res, HttpStatus.OK, 'vc request added successfully', vcData);
        } else {
            logger.error(`Insufficient credits`);
            return createResponse(res, HttpStatus.PAYMENT_REQUIRED, 'Insufficient Credits');
        }
    }

    public static async submitVCReview(req: Request, res: Response) {
        const logger = loggerFactory(VCController.servicename, 'submitVCReview');

        logger.info('review request: %o', req.body);

        const loggedInUser = res.locals.user;
        try {
        const data = await Promise.all([
            UserModel.getUserByEmail( loggedInUser.email ),
                         VcModel.saveReview(req.params.id, req.body.review)
        ]
                          );

        logger.info('response: %o, \n user: %o,\n file: ', data[0], data[1]);
        logger.info('input file id: ' + data[1]?.inputFileId);
        const file = await FileModel.findFileById(data[1]?.inputFileId || '');
        EmailService.reportCustomerFeedback(FeedbackMessageTemplates.getReviewMessage({
            forService: 'Video insights',
            user: data[0],
            reviews: data[1]?.reviews || [],
            inputURL:    file?.inputURL,
            outputURL: data[1]?.outputURL || ''
        }));
            } catch (err) {
                logger.error(`Error occurred while updating VC review information. ${err}`);

                return createResponse(res, HttpStatus.BAD_GATEWAY, 'couldn\'t update  the review');
            }

        return createResponse(res, HttpStatus.OK, 'successfully updated the review');
    }

    public  static async escalateRequest(req: Request, res: Response) {
        let methodname = 'escalateRequest';
        let logger = loggerFactory(VCController.servicename, methodname);
        logger.info('received request for vc Escalation: %o', req.body);
        try {
        const vcRequest = await VcModel.getVCRequestById(req.params.id);
        const sourceFile = await FileModel.getFileById(vcRequest?.inputFileId || '');
        if (vcRequest !== null && sourceFile !== null) {
        const escalationRequest = new EscalationModel({
            escalatorId: res.locals.user.id,
            escalationForService: AIServiceCategory.VC,
            escalationForResult: req.body.requestType,
            sourceFileId : vcRequest.inputFileId,
            serviceRequestId: vcRequest.vcRequestId,
            aiServiceConvertedFileURL: vcRequest.outputURL || ''
        });
        escalationRequest.persist();
        await vcRequest.changeStatusTo(VCRequestStatus.ESCALATION_REQUESTED);
        LedgerModel.createDebitTransaction(res.locals.user.id, Math.ceil(vcRequest.videoLength / 60) * 25, 'Escalation request for file: ' + vcRequest?.documentName);

        escalationRequest.notifyVCResolvingTeam(vcRequest, sourceFile);
    } else {
    logger.error('couldn\'t retrieve vc request id');
}
    } catch (error) {
        logger.error('Error occurred while creating escalation request for service id: ' + req.params.id + ' with error: %o', error);

        return createResponse(res, HttpStatus.BAD_GATEWAY, 'Internal server error');
    }
        return createResponse(res, HttpStatus.OK, 'successfullly escalated request');
    }

    public static async vcCallback(req: Request, res: Response) {
        const logger = loggerFactory(VCController.servicename, 'vcCallback');
        logger.info('callback received for external id: ' + req.query.id + ' with status: ' + req.query.state);

        try {
        const file = await FileModel.getFileByExternalVideoId(req.query.id as string);

        file?.waitingQueue.forEach(async vcRequestId => {
            try {
            const vcRequest = await VcModel.getVCRequestById(vcRequestId);
            if (vcRequest !== null) {
                await vcRequest.changeStatusTo(VCRequestStatus.CALLBACK_RECEIVED);
                VcResponseQueue.dispatch({
    vcRequestId: vcRequestId,
    videoId: req.query.id as string
});
                }
            } catch (error) {
                logger.error('error while updating vc request status: %o', error);
                            }
                });

        file?.clearWaitingQueue();
            } catch (error) {
                logger.error('Error in vc callback flow: %o', error);
                            }

        return createResponse(res, HttpStatus.OK, 'success');
    }

    public static async addCustomLanguageModel(req: Request, res: Response) {
const logger = loggerFactory(VCController.servicename, 'addCustomLanguageModel');
logger.info('got vc model creation request: %o', req.body);
try {
const loggedinUser = res.locals.user;

let model = new MLModelModel({
name: req.body.name,
 createdBy: loggedinUser.id
});

const afcRequest = await AfcModel.createAndPersist({
    userId: loggedinUser.id,
    inputFileId: req.body.dataFileId,
    outputFormat: AFCRequestOutputFormat.TEXT,
    documentName: req.body.name,
    triggeredBy: AFCTriggerer.VC_MODEL,
    status: AFCRequestStatus.REQUEST_INITIATED,
    docType: DocType.NONMATH
});

model.trainings.push(new TrainingInstance(
    TrainingStatus.CREATED,
     new Map([
    [req.body.dataFileId, afcRequest.afcRequestId]
])));
logger.info('model object: %o', model);
model = await model.persist();

afcRequest.updateTriggeringCaseId(model.modelId);

AfCRequestQueue.dispatch(afcRequest);
} catch (error) {
logger.error('encountered error in creating model training request: %o', error);
return createResponse(res, HttpStatus.BAD_GATEWAY, 'couldn\'t create request for model training');
}

return createResponse(res, HttpStatus.OK, 'model training started successfully');
    }

    public static async getAllModelsOfUser(req: Request, res: Response) {
        const logger = loggerFactory(VCController.servicename, 'getAllModelsOfUser');

        try {
          const models = await MLModelModel.getAllUserModels(res.locals.user.id);

          const modelsData = models.filter(model => model.trainedModelId).map(model => {
            return {
                modelId: model.modelId,
                name: model.name
            };
        });
          logger.info('model list data: %o', modelsData);
          return createResponse(res, HttpStatus.OK, 'retrieved models list', modelsData);
        } catch (error) {
            logger.error('error occurred while retrieving user model list: %o', error);
            return createResponse(res, HttpStatus.BAD_GATEWAY, 'couldn\'t get model list');
        }

    }
}

export default VCController;
