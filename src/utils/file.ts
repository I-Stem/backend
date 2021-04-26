import S3 from "aws-sdk/clients/s3";
import * as fs from "fs";
import { Request, Response, NextFunction } from "express";
import loggerFactory from "../middlewares/WinstonLogger";

const aws = require('aws-sdk');


let pkgcloud = require("pkgcloud"); // a cloud API standard library: https://github.com/nodejitsu/pkgcloud

let s3client = pkgcloud.storage.createClient({
    provider: "amazon",
    keyId: process.env.AWS_ACCESS_KEY_ID, // access key id
    key: process.env.AWS_SECRET_ACCESS_KEY, // secret key
    region: process.env.AWS_REGION, // region
});
const fileName = "fileUtils";

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});



const uploadFileToS3Bucket = (hash, filename, file, contentType: string) => {
    const logger = loggerFactory(fileName, "uploadFileToS3Bucket");
    logger.info("Uploading file to S3 bucket.......");
    const upload = s3.upload(
        {
            Bucket: process.env.AWS_BUCKET_NAME || "",
            Key: `files/${hash}/${filename}`,
            Body: contentType.includes("application/json")
                ? JSON.stringify(file)
                : file,
            ContentType: contentType,
        },
        function (err, data) {
            if (err) {
                logger.error(
                    `Error uplaoding file to S3: ${JSON.stringify(err)}`
                );
            }
        }
    );
    return upload.promise();
};

export async function saveOCRjson(file: any, hash: string, filename: string) {
    const logger = loggerFactory(fileName, "saveOCRjson");
    try {
        const upload = await uploadFileToS3Bucket(
            hash,
            filename,
            file,
            "application/json"
        );
        logger.info(`S3 upload completed, ${upload.Location}`);
        return upload.Location;
    } catch (err) {
        logger.info(`error during file upload ${err}`);
    }
}

export async function saveStudentsReportCSV(
    file: any,
    hash: string,
    filename: string
) {
    const logger = loggerFactory(fileName, "saveStudentRecordsCSV");
    try {
        const upload = await uploadFileToS3Bucket(
            hash,
            filename,
            file,
            "text/csv"
        );
        logger.info(`S3 upload completed, ${upload.Location}`);
        return upload.Location;
    } catch (err) {
        logger.info(`error during file upload ${err}`);
    }
}

export function onFileSaveToS3(
    file: any,
    container: string,
    fileKey:string,
    contentType:string
) {
    const logger = loggerFactory(fileName, "onFileSaveToS3");
    return s3.upload(
        {
            Bucket: container,
            Key: fileKey,
            Body: file,
            ContentType: contentType,
        }).promise();


}
