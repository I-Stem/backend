/**
 * Define the API base url
 *
 */

import Locals from '../../providers/Locals';
import { Request, Response, NextFunction } from 'express';
import { onFileSaveToS3 } from '../../utils/file';
import { response } from '../../utils/response';
import * as HttpStatus from 'http-status-codes';
import File from '../../models/File';
import loggerFactory from '../../middlewares/WinstonLogger';
import {getCircularReplacer} from '../../middlewares/HttpLogger';

class FileUpload {
    static servicename = 'File Upload';
    public static index(req: Request, res: Response, next: NextFunction): any {
        return res.json({
            message: Locals.config().name
        });
    }
    public static upload(req: Request, res: Response, next: NextFunction): any {
        const methodname = 'upload';
        const logger = loggerFactory(FileUpload.servicename, methodname);
        let hash = String(req.fields?.hash as string ?? '');
        logger.info(`Received file: ${req.files?.file.name}`);
        File.findOne({ hash: hash })
        .then(result => {
            if (result === null) {
                logger.info('File hash not found in existing files...');
                let filename = req.files?.file.name.replace(/\s+/g, '') || '';
                let file = req.files?.file;
                const loggedInUser = res.locals.user;
                logger.info(`Stripped filename: ${filename}`);
                logger.info(`Uploading file with name: ${file?.name}`);
                onFileSaveToS3( file, filename, hash, function (url: string) {
                    ++outfiles;
                    logger.info(`Saved file to S3. URL: ${url} File ID: ${fileId}`);
                    const file = new File({
                        users: [loggedInUser.id],
                        hash: hash,
                        inputURL: url,
                        name: filename,
                        OCRVersion: process.env.OCR_VERSION
                    });
                    logger.info(`File object: ${file}`);
                    file.save((err: any) => {
                        fileId = file.id;
                        if (err) {
                            logger.error(`Error occurred while saving file information to db. ${err}`);
                            return res.status(HttpStatus.BAD_GATEWAY).json(
                                response[HttpStatus.BAD_GATEWAY]({
                                    message: `An error occured while saving file information ${err}.`
                                })
                            );
                        }

                        logger.info('File upload successful.');
                        logger.info(`Response status ${HttpStatus.OK}\nResponse data: ${file}`);
                        return res.status(HttpStatus.OK).json(
                            response[HttpStatus.OK]({
                                data: file,
                                message: `File uploaded successfully!`
                            })
                        );
                    });
                });

                // let busboy = new Busboy({ headers: req.headers });
                let infiles = 0;
                let outfiles = 0;
                let fileId: string;
                let reqObj: any = {};
                // busboy.on('file', function (fieldname: string, file: any, filename: string, encoding: string) {
                //     ++infiles;
                //     console.log("hello");
                //     filename = filename.replace(/\s+/g, '');
                //     // onFileSaveToDisk(fieldname, file, filename, encoding, function() {
                //     onFileSaveToS3(fieldname, file, filename, encoding, function (url: string) {
                //         ++outfiles;
                //         console.log(url, fileId);
                //         File.findByIdAndUpdate(fileId, {inputURL: url}, {new: true})
                //         .exec()
                //         .then(f => {
                //             console.log(f);
                //         })
                //         .catch(err => {
                //             console.log(err);
                //         });
                //     });
                //     file.on('end', function () {
                //         console.log('File [' + filename + '] Finished');
                //     });
                // });
                // busboy.on('field', function (fieldname: string, val: string, fieldnameTruncatede: string, valTruncatede: string, encodinge: string, mimetypee: string) {
                //     console.log("hello2");
                //     reqObj[fieldname] = val;
                // });
                // busboy.on('finish', function () {
                //     console.log("hello3");
                //     const loggedInUser = res.locals.user;
                //     const file = new File({
                //         users: [loggedInUser.id],
                //         hash: hash
                //     });
                //     file.save((err: any) => {
                //         fileId = file.id;
                //         if (err) {
                //             return res.status(HttpStatus.BAD_GATEWAY).json(
                //                 response[HttpStatus.BAD_GATEWAY]({
                //                     message: `An error occured while saving vc information ${err}.`
                //                 })
                //             );
                //         }
                //         return res.status(HttpStatus.OK).json(
                //             response[HttpStatus.OK]({
                //                 data: file,
                //                 message: `File uploaded successfully!`
                //             })
                //         );
                //     });

                // });
                // req.pipe(busboy);
            } else {
                logger.info('File hash found in existing files.');
                logger.info('File upload successful.');
                logger.info(`Response status: ${HttpStatus.OK}\nResponse data: ${result}`);
                return res.status(HttpStatus.OK).json(
                    response[HttpStatus.OK]({
                        data: result,
                        message: `File uploaded successfully!`
                    })
                );
            }

        })
        .catch(err => {
            logger.error(`Error occcurred while saving VC Information to S3. ${err}`);
            logger.info(`Response status: ${HttpStatus.BAD_GATEWAY}\n response data: ${err}`);
            return res.status(HttpStatus.BAD_GATEWAY).json(
                response[HttpStatus.BAD_GATEWAY]({
                    message: `An error occured while saving vc information ${err}.`
                })
            );
        });

    }
}

export default FileUpload;
