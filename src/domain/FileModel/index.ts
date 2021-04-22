import FileDbModel from "../../models/File";
import loggerFactory from "../../middlewares/WinstonLogger";
import {VcModel} from "../VcModel";
import { VCRequestStatus, VideoExtractionType } from "../VcModel/VCConstants";
import emailService from "../../services/EmailService";
import ExceptionMessageTemplates, {
    ExceptionTemplateNames,
} from "../../MessageTemplates/ExceptionTemplates";
import {AfcModel} from "../AfcModel";
import { AFCRequestStatus, DocType } from "../AfcModel/AFCConstants";
import UserModel from "../user/User";
import {UserType, UserRoleEnum} from "../user/UserConstants";
import {UniversityRoles} from "../organization/OrganizationConstants";
import { saveOCRjson } from "../../utils/file";
import {FileProcessAssociations} from "./FileConstants";
import {Stream, Readable} from "stream";
import * as pdfJS from "pdfjs-dist/es5/build/pdf";
import { getVideoDurationInSeconds } from "get-video-duration";

export class UserContext {
    userId: string;
    processAssociation: FileProcessAssociations;
    organizationCode: string;
    associatedAt: Date;

    constructor(userId:string, processAssociation:FileProcessAssociations, organizationCode:string) {
        this.userId = userId;
        this.processAssociation = processAssociation;
        this.organizationCode = organizationCode;
        this.associatedAt = new Date();
    }
}

export class FileCoordinate {
container: string;
fileKey: string;
fileId?: string;

constructor(container: string, fileKey: string, fileId?: string) {
this.container = container;
this.fileKey = fileKey;
this.fileId = fileId;
}
}

export interface IFileModel {
    fileId?: string;
    _id?: string;
    userContexts: UserContext[];
    name: string;
    hash: string;
    size?: number;
    inputURL?: string;
    mimetype? :string;
    pages?: number;

    isRemediated?: boolean;
    videoLength?: number; // in seconds
    externalVideoId?: string;

    //file hold
    container:string;
fileKey?:string;
    createdAt?: Date;
}

class FileModel implements IFileModel {
    static serviceName = "FileModel";

    fileId: string = "";
    userContexts: UserContext[];
    name: string = "";
    hash: string;
    size: number = 0;
    inputURL: string = "";
    mimetype?: string;
    pages?: number;
    videoLength?: number;
    externalVideoId?: string;
    createdAt: Date;
    isRemediated?: boolean;

    //file hold
    container:string;
    fileKey: string;



    constructor(props: IFileModel) {
        this.fileId = props.fileId || props._id || "";
        this.userContexts = props.userContexts;
        this.name = props.name;
        this.hash = props.hash;
        this.size = props.size || 0;
        this.inputURL = props.inputURL || "";
        this.mimetype = props.mimetype;
        this.pages = props.pages;
        this.videoLength = props.videoLength;
        this.externalVideoId = props.externalVideoId;
this.isRemediated = props.isRemediated;
        this.createdAt = props.createdAt || new Date();
        this.container = props.container;
        this.fileKey = props.fileKey || "";
        }

        public async persist() : Promise<boolean> {
const logger = loggerFactory(FileModel.serviceName, "persist");
try {
const file = await new FileDbModel(this)
.save();
this.fileId = file.id;
return true;

} catch(error) {
    logger.error("couldn't save file information: %o", error);
}

return false;
        }

        public async setFileLocation(fileKey:string) {
            const logger = loggerFactory(FileModel.serviceName, "setFileLocation");
            try {
                this.fileKey = fileKey;
            await FileDbModel.findByIdAndUpdate(this.fileId, {
                fileKey,
                inputURL: `/file/raw/${this.fileId}`
            }).exec();
            logger.info("set file key: " + fileKey);
            } catch(error) {
logger.error("error: %o", error);
            }
        }

        public async isAssociatedWithUser(userId:string) {
            return this.userContexts.filter(userContext => {
                return userContext.userId.toString() === userId;
            }).length > 0;
        }
        
        public async associateFileWithUser(userId:string, processAssociation:FileProcessAssociations, organizationCode:string) {
            const logger = loggerFactory(FileModel.serviceName, "associateFileWithUser");
            logger.info(`associating user: ${userId} with file: ${this.name}`);
            try {
            await FileDbModel.findByIdAndUpdate(this.fileId, {
                $push: {
                    userContexts: new UserContext(userId, processAssociation, organizationCode)
                }
            });
        }
        catch(error) {
            logger.error("error while updating user association: %o", error);
        }
   }


/*
    public async updateConvertedFiles(
        requestType: VideoExtractionType,
        outputURL: string,
        videoLength: number
    ) {
        const logger = loggerFactory(
            FileModel.serviceName,
            "updateConvertedFiles"
        );
        logger.info("updating output results in file model");
        this.outputFiles.set(requestType, outputURL);
        this.videoLength = videoLength;
        try {
            const fieldName = `outputFiles.${requestType}`;
            logger.info(`setting value for field: ${fieldName}`);
            const file = await FileDbModel.findByIdAndUpdate(this.fileId, {
                $set: {
                    [fieldName]: outputURL,
                },
            }).exec();
        } catch (error) {
     logger.error('couldn\'t update the converted file information %o', error);
 }
     }
*/

     public async updateVideoId(videoId: string) {
await FileDbModel.findByIdAndUpdate(this.fileId, {
    externalVideoId: videoId
}).lean();
     }

     public async setIsRemediatedFile(isRemediated:boolean) {
this.isRemediated = isRemediated;
await FileDbModel.findByIdAndUpdate(this.fileId, {
    isRemediated
});
     }

     public static async findFileByHash(hash:string): Promise<FileModel | null> {
        const logger = loggerFactory(FileModel.serviceName, 'findFileByHash');
        const file = await FileDbModel.findOne({hash: hash}).lean();
        if (file !== null) {
        return new FileModel(file);
        } else {
    logger.info('couldn\'t get file by hash');
    }

        return null;
     }


    public static async getFileByHash(
        fileHash: string
    ): Promise<FileModel | null> {
        const logger = loggerFactory(FileModel.serviceName, "getFileByHash");
        const file = await FileDbModel.findOne({ hash: fileHash }).lean();

        if (file !== null) {
            return new FileModel(file);
        } else {
            logger.error("couldn't get file by hash");
            throw new Error("File not found with hash " + fileHash);
        }

        return null;
    }

    public static async findFileById(id: string): Promise<FileModel | null> {
        return FileDbModel.findOne({ _id: id }).lean();
    }

    public static async getFileByExternalVideoId(videoId: string) {
        const logger = loggerFactory(
            FileModel.serviceName,
            "getFileByExternalVideoId"
        );
        const file = await FileDbModel.findOne({
            externalVideoId: videoId,
        }).lean();
        if (file !== null) {
            return new FileModel(file);
        } else {
            logger.error("couldn't get file by video id");
        }

        return null;
    }

    public static async getFileById(fileId: string) {
        const logger = loggerFactory(FileModel.serviceName, "getFileById");
        try {
            const fileDocument = await FileDbModel.findById(fileId).lean();
            if (!fileDocument) {
throw new Error(`file not found with id: ${fileId}`);
            } else {
                const fileModelInstance = new FileModel(fileDocument);
                return fileModelInstance;
            }
        } catch (error) {
            logger.error("error while retrieving file by id: %o", error);
            throw error;
        }
        return null;
    }

/*
    public static vcInputFileHandler(vc: VcModel & mongoose.Document) {
        const logger = loggerFactory(
            FileModel.serviceName,
            "vcInputFileHandler"
        );
        FileDbModel.findById(vc.inputFileId)
            .exec()
            .then(async (file) => {
                const index = file?.ocrWaitingQueue.indexOf(vc?._id);
                if (index! > -1) {
                    file?.ocrWaitingQueue.splice(index!, 1);
                    await new VcModel({
                        ...vc,
                    }).changeStatusTo(VCRequestStatus.INSIGHT_FAILED);
                    await file?.save();
                    const user = await UserModel.getUserById(vc?.userId);
                    if (user) {
                        emailService.sendEmailToUser(
                            user,
                            ExceptionMessageTemplates.getAFCFailureMessageForUser(
                                {
                                    documentName: vc.documentName,
                                    user: user.fullname,
                                }
                            )
                        );
                    }
                }
            })
            .catch((err) =>
                logger.error(
                    `Error occured in finding file for requested id ${err}, ${vc.id}`
                )
            );

    }
*/

    public static getFileNameByProcessAssociationType(fileName:string, processAssociation:string) {

        let getExtension = () => {
            return (fileName.lastIndexOf(".") > -1 ) ? fileName.substr(fileName.lastIndexOf(".")) : "";
        }
        switch(processAssociation) {
            case FileProcessAssociations.AFC_INPUT:
                return "afcInputFile" + getExtension();

                case FileProcessAssociations.AFC_OUTPUT: 
                return "afcOutputFile" + getExtension();

                case FileProcessAssociations.AFC_REMEDIATION:
                return "afcRemediatedFile" + getExtension();

                case FileProcessAssociations.VC_INPUT:
                return "vcInputFile" + getExtension();

                case FileProcessAssociations.VC_OUTPUT:
                return "vcOutputFile" + getExtension();

                case FileProcessAssociations.VC_REMEDIATION:
                return "vcRemediatedFile" + getExtension();

                case FileProcessAssociations.VC_CUSTOM_MODEL_TRAINING_DATA:
                return "vcCustomModelTrainingDataFile" + getExtension();

                case FileProcessAssociations.COMMUNITY_JOB_RESUME:
                return "resumeFile" + getExtension();

        }
    }

    public async setFileMetadata(stream: Stream, mimetype: string) {
        const logger = loggerFactory(FileModel.serviceName, "setFileMetadata");

        return new Promise((resolve, reject) => {
try {
        const fileDataChunks:any[] = [];
        stream.on("data", (dataChunk) => {
fileDataChunks.push(dataChunk);
        });
        stream.on("end", async () => {
            const fileData = Buffer.concat(fileDataChunks);

            if(mimetype === "application/pdf") {
 pdfJS.getDocument({data: fileData}).promise.then(async (doc) => {
logger.info(`Number of pages in pdf: ${doc.numPages}`);
await FileDbModel.findByIdAndUpdate(this.fileId, {
    pages: doc.numPages,
    size: fileData.length
}).exec();
resolve(fileData);
        });
    }
    else if(mimetype.startsWith("image/")) {
        await FileDbModel.findByIdAndUpdate(this.fileId, {
            pages: 1,
            size: fileData.length
        }).exec();
        resolve(fileData);
    } else if(mimetype.startsWith("audio/") || mimetype.startsWith("video/")) {
const videoLength = Math.ceil(await getVideoDurationInSeconds(Readable.from(fileData)));
logger.info(`got video length as ${videoLength}`);
await FileDbModel.findByIdAndUpdate(this.fileId, {
    videoLength: videoLength,
    size: fileData.length
}).exec();
resolve(fileData);
    } else {
        logger.info("processing as generic mime type upload");
        await FileDbModel.findByIdAndUpdate(this.fileId, {
            size: fileData.length
        }).exec();
        resolve(fileData);
    }
    });
    } catch(error) {
        logger.error("error: %o", error);
        reject(error);
    }
    });
    }

    public isFileAssociatedWithUser(userId:string) {
        return this.userContexts.filter(userContext => userContext.userId.toString() === userId).length > 0;
    }

    public isAssociatedWithOrganizationCode(organizationCode: string) {
        return this.userContexts.filter(userContext => userContext.organizationCode === organizationCode).length > 0;
    }

    public static isFileAccessibleToElevatedUser(userType: string, role: string) {
if(userType === UserType.I_STEM) {
 if([UniversityRoles.STAFF.toString(), UserRoleEnum.ADMIN.toString(), UniversityRoles.REMEDIATOR.toString()].includes(role)) {
     return true;
 }
} 
return false;
    }

    public static isFileAccessibleToOrganizationElevatedUserRole(userType:string, role:string, accessorOrganizationCode:string, ownerOrganizationCode: string) {
        if (userType === UserType.UNIVERSITY || userType === UserType.BUSINESS) {
            if(accessorOrganizationCode === ownerOrganizationCode 
                && [UniversityRoles.REMEDIATOR.toString(), UniversityRoles.STAFF.toString()].includes(role)) {
                    return true;
                }
            }
            return false;
    }

    public isFileAccessibleToOrganizationElevatedUserRole(userType:string, role:string, accessOrganizationCode:string) {
        if (userType === UserType.UNIVERSITY || userType === UserType.BUSINESS) {
                if([UniversityRoles.REMEDIATOR.toString(), UniversityRoles.STAFF.toString()].includes(role)) {
                    if(this.isAssociatedWithOrganizationCode(accessOrganizationCode))
                    return true;
                }
            }
            return false;
    }

    public getFileFullURL() {
        return `${process.env.PORTAL_URL}${this.inputURL}`;
    }
}

export default FileModel;
