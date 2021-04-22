/**
 * Define the API base url
 *
 */

import Locals from '../../providers/Locals';
import { Request, Response, NextFunction } from 'express';
import BusBoy from "busboy";
import { onFileSaveToS3 } from '../../utils/file';
import { createResponse} from '../../utils/response';
import * as HttpStatus from 'http-status-codes';
import loggerFactory from '../../middlewares/WinstonLogger';
import {getCircularReplacer} from '../../middlewares/HttpLogger';
import FileModel, {UserContext} from "../../domain/FileModel";
import {Stream} from "stream";
import {AfcModel} from "../../domain/AfcModel";
import FileService from "../../services/FileService";
import {VcModel} from "../../domain/VcModel";
import {VideoExtractionType} from "../../domain/VcModel/VCConstants";

enum ServiceType {
    AFC = "AFC",
    VC = "VC",
    RAW = "RAW"
}

class UploadData {
    isNewFile:boolean = false; 
    fileModel:FileModel | null = null;
     fileURL:string = "";
         }

class FileUpload {
    static servicename = 'FileUpload';
    public static async upload(req: Request, res: Response, next: NextFunction) {
        const logger = loggerFactory(FileUpload.servicename, "upload");
        const loggedInUser = res.locals.user;

        try {
            const uploadData = await FileUpload.getS3URLForFile(req, loggedInUser);

            let hash = req.body.hash;
            let fileProcessAssociation = req.body.processAssociation;
            let filename = req.body.fileName;

if(uploadData.isNewFile) {


                        return createResponse(res, HttpStatus.OK, "file uploaded successfully", {
                            _id: uploadData.fileModel?.fileId,
                            userId: loggedInUser.id,
                            name: filename
                        });
            } else {
                logger.info('skipping put on s3');

                uploadData.fileModel?.associateFileWithUser(loggedInUser.id, fileProcessAssociation, loggedInUser.organizationCode);
                return createResponse(res, HttpStatus.OK, "file stored successfully", {
                    _id: uploadData.fileModel?.fileId,
                    userId: loggedInUser.id,
                    name: filename
                });

            }

        }
        catch(err) {
            logger.error("Error occurred while saving file Information to S3: %o", err);

            return createResponse(res, HttpStatus.BAD_GATEWAY, "error while saving file");
        }

    }

    private static returnFileWithName(res:Response, fileStream: Stream, documentName:string) {
        const logger = loggerFactory(FileUpload.servicename, "returnFileWithName");
        res.attachment(documentName);
        logger.info("sending file to user");
        fileStream.pipe(res);
        fileStream.on("error", (error) => {
            logger.error("error in reading file from s3 server: %o", error);
            return createResponse(res, HttpStatus.BAD_GATEWAY, "couldn't download file");
        });

        res.on("error", (error) => {
            logger.error("error in writing to http response stream", error);
            return createResponse(res, HttpStatus.BAD_GATEWAY, "couldn't download file");
        });
    }

    public static async getFileForUser(req:Request, res:Response) {
        const logger = loggerFactory(FileUpload.servicename, "getFileForUser");

        const serviceType = req.params.serviceType.toUpperCase();
        const fileKey = req.params.fileKey;
const loggedInUser = res.locals.user;
        if(serviceType === ServiceType.AFC) {
            const afcRequest = await AfcModel.getAfcModelById(fileKey);
            if(afcRequest !== null  && afcRequest.outputFile !== undefined) {
                logger.info(`downloading file ${afcRequest.documentName} for user: ${loggedInUser.email}`);
if(
    (loggedInUser.id === afcRequest.userId.toString())
    || FileModel.isFileAccessibleToOrganizationElevatedUserRole(loggedInUser.userType, loggedInUser.role, loggedInUser.organizationCode, afcRequest.organizationCode)
    || FileModel.isFileAccessibleToElevatedUser(loggedInUser.userType, loggedInUser.role)
) {
                            const fileStream = FileService.getFileStreamByS3Key(afcRequest.outputFile.container, afcRequest.outputFile.fileKey);
                return FileUpload.returnFileWithName(res, fileStream, `${afcRequest.documentName}.${afcRequest.outputFormat.toLowerCase()}`);
        } 
    }else {
            logger.error(`couldn't get afc request with id: ${fileKey} tried by ${loggedInUser.email}`);
            return createResponse(res, HttpStatus.NOT_FOUND, "file doesn't exist");
        }
           } else if(serviceType === ServiceType.VC) {
            const vcRequest = await VcModel.getVCRequestById(fileKey);
            if(vcRequest !== null  && vcRequest.outputFile !== undefined) {
                logger.info(`downloading file ${vcRequest.documentName} for user: ${loggedInUser.email}`);
if(
    (loggedInUser.id === vcRequest.userId.toString())
    || FileModel.isFileAccessibleToOrganizationElevatedUserRole(loggedInUser.userType, loggedInUser.role, loggedInUser.organizationCode, vcRequest.organizationCode)
    || FileModel.isFileAccessibleToElevatedUser(loggedInUser.userType, loggedInUser.role)
) {
                            const fileStream = FileService.getFileStreamByS3Key(vcRequest.outputFile.container, vcRequest.outputFile.fileKey);
                return FileUpload.returnFileWithName(res, fileStream, `${vcRequest.documentName}.${vcRequest.requestType === VideoExtractionType.OCR_CAPTION ? "zip" : vcRequest.outputFormat?.toLowerCase()}`);
        } 
    }else {
            logger.error(`couldn't get vc request with id: ${fileKey} tried by ${loggedInUser.email}`);
            return createResponse(res, HttpStatus.NOT_FOUND, "file doesn't exist");
        }
        } else if(serviceType === ServiceType.RAW) {
const file = await FileModel.getFileById(fileKey);
if(file !== null) {
    if(file.isAssociatedWithUser(loggedInUser.id)
    || FileModel.isFileAccessibleToElevatedUser(loggedInUser.userType, loggedInUser.role )
    || file.isFileAccessibleToOrganizationElevatedUserRole(loggedInUser.userType, loggedInUser.role, loggedInUser.organizationCode)
    ) {
        const fileStream = FileService.getFileStreamByS3Key(file.container, file.fileKey);
        return FileUpload.returnFileWithName(res, fileStream, "file" + file.name.substr(file.name.lastIndexOf(".")));
    }
}
        }
        
        logger.error(`Couldn't get file by key: ${req.url}`);
        return createResponse(res, HttpStatus.NOT_FOUND, "file doesn't exist");
    }

    //The uploaded file should be the last field in the coming form
    //for following code to work
    public static  getS3URLForFile(req:Request, loggedInUser:any):Promise<UploadData> {
const logger = loggerFactory(FileUpload.servicename, "getS3URLForFile");
return new Promise((resolve, reject) => {
    let uploadData: UploadData;
    const uploadLimit = Number(process.env.MAX_FILE_UPLOAD_SIZE) * 1024 * 1024;
logger.info("starting file upload with maximum limit: " + uploadLimit);
let busboy = new BusBoy({
    headers: req.headers,
limits: {
    fileSize: uploadLimit
}
});

busboy.on('field', async (field, value) => {
    req.body[field] = value;
});

busboy.on('file', async function(fieldname, file, filename, encoding, mimetype) {
    logger.info(`Received file: ${req.body.fileName} for process ${req.body.processAssociation} by user ${loggedInUser.email} and organization ${loggedInUser.organizationCode} with hash ${req.body.hash}`);
logger.info(`file field name: ${fieldname}, file: ${file}, filename: ${filename}, encoding ${encoding}, mime: ${mimetype}`);
try {
            const fileModel = await FileModel.findFileByHash(req.body.hash);
            if(fileModel === null) {
                logger.info(`File hash not found in existing files : ${req.body.hash}`);
                const fileInstance = new FileModel({
                    userContexts: [new UserContext(loggedInUser.id, req.body.processAssociation, loggedInUser.organizationCode, )],
                    hash: req.body.hash,
                    name: filename, //FileModel.getFileNameByProcessAssociationType(req.body.fileName, req.body.processAssociation) || "",
                    container: process.env.AWS_BUCKET_NAME || "",
                    mimetype: mimetype
                });

                const isSuccessful = await fileInstance.persist();
                if(!isSuccessful) {
                reject(new Error("couldn't save file"));
return null;
                }
                
                const fileKey = `${loggedInUser.organizationCode}/${fileInstance.fileId.toString()}/${FileModel.getFileNameByProcessAssociationType(req.body.fileName, req.body.processAssociation)}`;

                const fileBuffer = await fileInstance.setFileMetadata(file, mimetype);
                logger.info("going to put on s3");
                    const result = await onFileSaveToS3( fileBuffer, fileInstance.container, fileKey, mimetype);
                    logger.info("s3 upload complete");
                    await fileInstance.setFileLocation(fileKey);
                            uploadData = {isNewFile: true, fileURL: result.Location || "", fileModel: fileInstance};
                            resolve(uploadData);
                              }
            else {
            await file.resume();
            uploadData = {isNewFile: false, fileModel, fileURL: fileModel.inputURL || ""};
            file.on("end", () => {
                resolve(uploadData);
            })
                        }

            
        } catch(error) {
            logger.error("error: %o", error);
            reject(error);
        }
});

busboy.on("finish", () => {
logger.info("finished file processing");
});
req.pipe(busboy);
});
    }
}

export default FileUpload;
                