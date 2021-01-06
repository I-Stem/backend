// const aws = require("aws-sdk");
import S3 from "aws-sdk/clients/s3";
import * as fs from "fs";
import { Request, Response, NextFunction } from "express";

let pkgcloud = require("pkgcloud"); // a cloud API standard library: https://github.com/nodejitsu/pkgcloud
let s3client = pkgcloud.storage.createClient({
    provider: "amazon",
    keyId: process.env.AWS_ACCESS_KEY_ID, // access key id
    key: process.env.AWS_SECRET_ACCESS_KEY, // secret key
    region: process.env.AWS_REGION, // region
});
const fileName = "fileUtils";

const getBlobName = (originalName: string) => {
    // const identifier = Math.random()
    //     .toString()
    //     .replace(/0\./, ''); // remove "0." from start of string

    return `inputFile-${originalName.replace(/\s+/g, '-').toLowerCase()}`;
};

const uploadFileToS3Bucket = (hash, filename, file) => {
    const s3 = new S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
    });
    const upload = s3.upload(
        {
            Bucket: process.env.AWS_BUCKET_NAME || "",
            Key: `files/${hash}/${filename}`,
            Body: JSON.stringify(file),
            ContentType: "application/json",
        },
        function (err, data) {
            console.log(JSON.stringify(err) + " " + JSON.stringify(data));
        }
    );
    return upload.promise();
};

export async function saveOCRjson(file: any, hash: string, filename: string) {
    try {
        const upload = await uploadFileToS3Bucket(hash, filename, file);
        console.log(`S3 upload completed, ${upload.Location}`);
        return upload.Location;
    } catch (err) {
        console.log(`error during file upload ${err}`);
    }
}

export function onFileSaveToS3(
    file: any,
    filename: string,
    hash: string,
    next: NextFunction
) {
    let readStream = fs.createReadStream(file.path);
    let writeStream = s3client.upload(
        {
            container: process.env.AWS_BUCKET_NAME + `/files/${hash}`,
            remote: getBlobName(filename),
        },
        function (err: any) {
            console.log(err);
            next();
        }
    );
    writeStream
        .on("success", function (file: any) {
            next(file.location);
        })
        .on("error", function (err: any) {
            console.log(err);
        });
    readStream.pipe(writeStream);

    // file.pipe(
    //     s3client.upload({
    //         container: process.env.AWS_BUCKET_NAME,
    //         remote: getBlobName(filename)
    //     }, function (err: any) {
    //         next();
    //         console.log(err);
    //     }
    // ))

    // else{
    //     let readStream = fs.createReadStream(file);
    //     readStream.pipe(writeStream);
    // }
}
