import { FileUpload as IFileUpload } from 'graphql-upload';

import Local from './local';
import Minio from './minio';
import FileRecord from '../../database/models/FileRecord';
import * as config from '../../config';
import { FileStorageNamespace } from '../../types/FileStorageNamespace'

/* Uniform API for interacting with files in the system whose backend can be configured to work with local or S3 or GCS via the config file */
export default class FileService {
  /**
   * Performs the logic for adding documents and uploading files
   *
   * @private
   * @member {Local | Minio} uploader
   */
  private _uploader: Minio | Local;

  /*
   * Initialize appopriate file upload backend as per configuration.
   */
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (config.uploadTo === 'aws') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this._uploader = new Minio();
    } else {
      this._uploader = new Local();
    }
  }

  /**
   * Method to convert an uploaded file from FileUpload format to a File DB Model instance.
   *
   * @private
   * @param {IFileUpload} uploadObj uploaded file to be converted
   * @param {string} fileHash A hash to identify the file with
   * @returns {Files} an instance of Files DB Model
   */
  private _asFile(uploadObj: IFileUpload, fileHash: string, namespace: FileStorageNamespace) {
    const fileRecord = new FileRecord({
      hash: fileHash,
      namespace: JSON.stringify(namespace),
      fileType: uploadObj.mimetype,
      metadata: {
        provider: config.uploadTo,
        encoding: uploadObj.encoding,
        key: fileHash,
        originalName: uploadObj.filename
      }
    });
    return fileRecord;
  }

  /**
   * Method to save an uploaded file to storage and create uncommited instance of the file in the File DB Model
   *
   * @param {IFileUpload} uploadObj The uploaded file in the FileUpload format, to be saved to storage and db
   * @returns {Promise<FileRecord>} An uncommited instance of the Files DB Model representing the uploaded file
   */
  public upload(uploadObj: IFileUpload, fileHash: string, namespace: FileStorageNamespace) {
    const fileRecord = this._asFile(uploadObj, fileHash, namespace);
    console.log("fileRecord created: ", fileRecord);
    return new Promise<FileRecord>((resolve, reject) =>
      uploadObj
        .createReadStream()
        .pipe(this._uploader.writeStream(fileRecord))
        .on('finish', () => resolve(fileRecord))
        .on('error', (err: Error) => reject(err)),
    );
  }

  /**
   * Method to obtain a signed URL of a file in DB along with option to set an expiry for the link
   *
   * @param {FileRecord} file An instance of the Files DB Model representing the file in DB
   * @param {number?} expiry The number of seconds for which the link is to be valid for.
   */
  public getSignedUrl(file: FileRecord, expiry?: number): Promise<string> {
    if(this._uploader instanceof Local) {
        return this._uploader.getSignedUrl(file);
    }
    return this._uploader.getSignedUrl(file, expiry)
  }
}
