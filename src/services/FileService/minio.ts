// import { Files } from '../../database/models/Files';
import { PassThrough } from 'stream';
import * as Minio from 'minio';

import * as config from '../../config';
import FileRecord from 'models/FileRecord';

export default class S3 {
  /**
   * The bucket on which the operations are to be performed on
   *
   * @private
   * @member {string} _bucket
   */
  private _bucket: string;

  /**
   * An instance of the AWS S3 SDK initialized with the credentials
   *
   * @private
   * @member {Minio.Client} minio
   */
  private minio: Minio.Client;

  /**
   * Configures the instance with the appropriate settings for which bucket to use and the SDK
   *
   * @param {string} bucket The name of the bucket to use
   */
  constructor() {
    this._bucket = config.storageProviders.aws.s3.bucket;
    this.minio = new Minio.Client({
      endPoint: config.storageProviders.aws.s3.endpoint || `s3.${config.storageProviders.aws.region}.amazonaws.com`,
      port: config.storageProviders.aws.s3.port,
      accessKey: config.storageProviders.aws.accessKeyId,
      secretKey: config.storageProviders.aws.secretAccessKey,
      region: config.storageProviders.aws.region,
      /**
       * Disable TLS when we're using the local devserver / testserver
       */
      useSSL: config.storageProviders.aws.s3.port !== 9000,
    });
  }

  /**
   * Method to create a write stream to the configured bucket, using the provided filename as the key
   *
   * @param {FileRecord} fileRecord The name with which the file has to be saved in the bucket
   * @returns {PassThrough} A Passthrough stream which can be used to write a file a to the bucket
   */
  public writeStream(fileRecord: FileRecord) {
    const pass = new PassThrough();

    console.log("seems to be in minio")

    this.minio
      .putObject(this._bucket, `content-addressable/${fileRecord.hash}`, pass, {...fileRecord.metadata, 'Content-Type': fileRecord.fileType })
      .then(etag => {
        pass.destroy();
      })
      .catch(err => {
        pass.destroy(err);
      })

    return pass;
  }

  /**
   * Method to get a signed URL to read the file
   *
   * @param {FileRecord} file An instance of the Files DB Model whose signed URL has to be obtained
   * @param {number?} expiry The number of seconds for which the link is to be valid for
   * @returns {Promise<string>} The signed URL to be used for accessing the file
   */
  public getSignedUrl(file: FileRecord, expiry = 60 * 10): Promise<string> {
    return new Promise((resolve, reject) => {
      this.minio.presignedGetObject(this._bucket, `content-addressable/${file.hash}`, expiry, {
        'Content-Type': file.fileType || 'application/octet-stream'
      }, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result);
      });
    });
  }
}
