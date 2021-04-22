import loggerFactory from "../middlewares/WinstonLogger";
import AWS from  'aws-sdk';
import Stream from 'stream';


AWS.config.update(
    {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID, // access key id
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // secret key
      region: process.env.AWS_REGION // region
    }
  );

class FileService {
    static serviceName = "FileService";

    s3: AWS.S3 = new AWS.S3({
      region: process.env.AWS_REGION || ""
    });

    public getFileStreamByS3Key(container: string, fileKey:string):Stream {
const logger = loggerFactory(FileService.serviceName, "getFileByS3Key");
logger.info("getting file with key: " + fileKey);
const fileStream = this.s3.getObject({
    Bucket: container,
    Key: fileKey
})
.createReadStream();

return fileStream;
    }

    public async getFileDataByS3Key(container: string, fileKey:string):Promise<any> {
      const logger = loggerFactory(FileService.serviceName, "getFileByS3Key");
     logger.info("getting file with key: " + fileKey + " from " + container);
     const filePromise = new Promise((resolve, reject) => {
      this.s3.getObject({
          Bucket: container,
          Key: fileKey
      }, function(error, data) {
        if(error) {
        logger.error("encountered error while downloading file from s3: %o", error);
        reject(error);
        }
        logger.info("got data for file: %o", data);
        resolve(data);
      })
    });
      
      return filePromise;
          }
      
public getPresignedURL(container:string, fileKey) {
  const logger = loggerFactory(FileService.serviceName, "getPresignedURL");
  return new Promise((resolve, reject) => {
    this.s3.getSignedUrl("getObject", {
      Bucket: container,
      Key: fileKey,
      Expires: Number(process.env.LINK_EXPIRY_TIME)
    }, (error, url) => {
      if(error) {
        logger.error("error: %o", error);
      return reject(error);
      }
logger.info("got signed url: " + url);
resolve(url);
    });
});
}

}

export default new FileService();