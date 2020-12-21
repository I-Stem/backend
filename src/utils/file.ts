
const aws = require('aws-sdk');
import * as fs from 'fs';
import { Request, Response, NextFunction } from 'express';

let pkgcloud = require('pkgcloud'); // a cloud API standard library: https://github.com/nodejitsu/pkgcloud
let s3client = pkgcloud.storage.createClient({
    provider: 'amazon',
    keyId: process.env.AWS_ACCESS_KEY_ID, // access key id
    key: process.env.AWS_SECRET_ACCESS_KEY, // secret key
    region: process.env.AWS_REGION // region
});

const getBlobName = (originalName: string) => {
    // const identifier = Math.random()
    //     .toString()
    //     .replace(/0\./, ''); // remove "0." from start of string

    return `inputFile-${originalName.replace(/\s+/g, '-').toLowerCase()}`;
};

export function onFileSaveToS3(file: any, filename: string, hash: string, next: NextFunction) {
    let readStream = fs.createReadStream(file.path);

    let writeStream = s3client.upload({
        container: process.env.AWS_BUCKET_NAME + `/files/${hash}`,
        remote: getBlobName(filename)
    }, function (err: any) {
        console.log(err);
        next();
    });
    // file.pipe(
    //     s3client.upload({
    //         container: process.env.AWS_BUCKET_NAME,
    //         remote: getBlobName(filename)
    //     }, function (err: any) {
    //         next();
    //         console.log(err);
    //     }
    // ))
    writeStream.on('success', function(file: any) {
        next(file.location);
    }).on('error', function(err: any) {
        console.log(err);
    });

    readStream.pipe(writeStream);

}
