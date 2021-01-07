import FileDbModel from '../models/File';
import { plainToClass } from 'class-transformer';
import loggerFactory from '../middlewares/WinstonLogger';
import { VCRequestStatus, VideoExtractionType } from './VcModel';
import emailService from '../services/EmailService';
import MessageModel, { MessageLabel } from './MessageModel';
import ExceptionMessageTemplates, {
    ExceptionTemplateNames
} from '../MessageTemplates/ExceptionTemplates';
import { AFCRequestStatus, DocType } from './AfcModel';
import UserModel from './User';
import { onFileSaveToS3, saveOCRjson } from '../utils/file';

export interface IFileModel {
    fileId?: string;
    _id?: string;
    users: string[];
    name: string;
    hash: string;
    size: number;
    inputURL: string;
    json: any;
    pages?: number;
    OCRVersion?: string;
    videoLength?: number; // in seconds
    externalVideoId?: string;
    waitingQueue?: string[];
    outputFiles?: object;
    createdAt?: Date;
    ocrFileURL?: string;
    mathOcrFileUrl?: string;
}

class FileModel implements IFileModel {
    static serviceName = 'FileModel';

    fileId: string = '';
    users: string[] = [];
    name: string = '';
    hash: string;
    size: number = 0;
    inputURL: string = '';
    json: any;
    pages?: number;
    videoLength?: number;
    externalVideoId?: string;
    waitingQueue: string[] = [];
    OCRVersion = ' ';
    ocrFileURL: string;
    outputFiles: Map<string, string> = new Map();
    createdAt: Date;
    mathOcrFileUrl?: string;

    constructor(props: IFileModel) {
        this.fileId = props.fileId || props._id || '';
        this.users = props.users;
        this.name = props.name;
        this.hash = props.hash;
        this.size = props.size;
        this.inputURL = props.inputURL;
        this.json = props.json;
        this.pages = props.pages;
        this.videoLength = props.videoLength;
        this.externalVideoId = props.externalVideoId;
        this.OCRVersion = props.OCRVersion || '';
        this.waitingQueue = props.waitingQueue || [];
        this.outputFiles = new Map(Object.entries(props.outputFiles || {}));
        this.createdAt = props.createdAt || new Date();
        this.ocrFileURL = props.ocrFileURL || '';
        this.mathOcrFileUrl = props.mathOcrFileUrl || '';
    }

    public async addRequestToWaitingQueue(requestId: string) {
        const logger = loggerFactory(
            FileModel.serviceName,
            'addRequestToWaitingQueue'
        );
        logger.info('adding request to waiting queue: ' + requestId);
        this.waitingQueue.push(requestId);
        FileDbModel.findOneAndUpdate(
            { hash: this.hash },
            {
                $push: { waitingQueue: requestId }
            }
        ).exec();
    }

    public async clearWaitingQueue() {
        const logger = loggerFactory(
            FileModel.serviceName,
            'clearWaitingQueue'
        );
        logger.info('clearing the waiting queue');
        this.waitingQueue.splice(0, this.waitingQueue.length);
        await FileDbModel.findByIdAndUpdate(this.fileId, {
            waitingQueue: []
        }).exec();
    }

    public async updateOCRVersion(OCRVersion: string) {
        const logger = loggerFactory(FileModel.serviceName, 'updateOCRVersion');
        logger.info('updatring OCR version to: ' + OCRVersion);
        this.OCRVersion = OCRVersion;
        await FileDbModel.findByIdAndUpdate(this.fileId, {
            OCRVersion: OCRVersion
        }).exec();
    }

    public async updateOCRResults(hash: string, json: any, pages: number, docType: string) {
        const logger = loggerFactory(FileModel.serviceName, 'updateOCRResults');
        try {
            let fileName = 'ocr-json.json';
            if(docType === DocType.MATH){
                fileName = 'math-ocr-json.json';
            }
            const url = await saveOCRjson(json, hash, fileName);
            logger.info(`The doctype: ${docType}`);
            if(docType === DocType.NONMATH) {
                await FileDbModel.findOneAndUpdate(
                    { hash: hash },
                    {
                        pages: pages,
                        ocrFileURL: url
                    }
                ).lean();
            } else{
                await FileDbModel.findOneAndUpdate(
                    { hash: hash },
                    {
                        pages: pages,
                        mathOcrFileUrl: url
                    }
                ).lean();
            }
        } catch (err) {
            logger.error('error occured' + err);
        }
    }

    public async updateConvertedFiles(
        requestType: VideoExtractionType,
        outputURL: string,
        videoLength: number
    ) {
        const logger = loggerFactory(
            FileModel.serviceName,
            'updateConvertedFiles'
        );
        logger.info('updating output results in file model');
        this.outputFiles.set(requestType, outputURL);
        this.videoLength = videoLength;
        try {
            const fieldName = `outputFiles.${requestType}`;
            logger.info(`setting value for field: ${fieldName}`);
            const file = await FileDbModel.findByIdAndUpdate(this.fileId, {
                $set: {
                    [fieldName]: outputURL
                }
            }).exec();
        } catch (error) {
            logger.error(
                'couldn\'t update the converted file information %o',
                error
            );
        }
    }

    public async updateVideoId(videoId: string) {
        await FileDbModel.findByIdAndUpdate(this.fileId, {
            externalVideoId: videoId
        }).lean();
    }

    public static async getFileByHash(
        fileHash: string
    ): Promise<FileModel | null> {
        const logger = loggerFactory(FileModel.serviceName, 'getFileByHash');
        const file = await FileDbModel.findOne({ hash: fileHash }).lean();
        if (file !== null) {
            return new FileModel(file);
        } else {
            logger.error('couldn\'t get file by hash');
        }

        return null;
    }

    public static async findFileById(id: string): Promise<FileModel | null> {
        return FileDbModel.findOne({ _id: id }).lean();
    }

    public static async getFileByExternalVideoId(videoId: string) {
        const logger = loggerFactory(
            FileModel.serviceName,
            'getFileByExternalVideoId'
        );
        const file = await FileDbModel.findOne({
            externalVideoId: videoId
        }).lean();
        if (file !== null) {
            return new FileModel(file);
        } else {
            logger.error('couldn\'t get file by video id');
        }

        return null;
    }

    public static async getFileById(fileId: string) {
        const logger = loggerFactory(FileModel.serviceName, 'getFileById');
        try {
            const fileDocument = await FileDbModel.findById(fileId).lean();
            if (!fileDocument) {
                logger.error('couldn\'t get file by id: ' + fileId);
            } else {
                const fileModelInstance = new FileModel(fileDocument);
                return fileModelInstance;
            }
        } catch (error) {
            logger.error('error while retrieving file by id: %o', error);
        }

        logger.error('couldn\'t get file with id: ' + fileId);
        return null;
    }

    public static afcInputFileHandler(afc: any) {
        const logger = loggerFactory(
            FileModel.serviceName,
            'afcInputFileHandler'
        );
        FileDbModel.findById(afc.inputFileId)
            .exec()
            .then(async (file) => {
                if (!file?.json) {
                    const index = file?.waitingQueue.indexOf(afc?._id);
                    if (index! > -1) {
                        file?.waitingQueue.splice(index!, 1);
                        afc.status = AFCRequestStatus.OCR_FAILED;
                        afc?.save();
                        file?.save();
                        const user = await UserModel.getUserById(afc?.userId);
                        if (user) {
                            emailService.sendEmailToUser(
                                user,
                                ExceptionMessageTemplates.getAFCFailureMessageForUser(
                                    {
                                        documentName: afc.documentName,
                                        user: user.fullname
                                    }
                                )
                            );
                        }
                    }
                }
            })
            .catch((err) =>
                logger.error(
                    `Error occured in finding file for requested id ${err}`
                )
            );
    }
}

export default FileModel;
