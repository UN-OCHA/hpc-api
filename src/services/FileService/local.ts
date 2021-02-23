import { createWriteStream } from 'fs';
import { join } from 'path';

import FileRecord from '../../database/models/FileRecord';
import * as config from '../../config';

export default class Local {
  /**
   * Path to the directory in the server to which the uploaded files are to be saved
   *
   * @private
   * @member {string} _basePath
   */
  private _basePath: string;

  /**
   * Configures the instance with the appropriate settings
   *
   * @param {string?} path Path to the directory in the server to which the uploaded files are to be saved
   */
  constructor(path = join(__dirname, `../../../${config.storageProviders.local.uploadDirectory}`)) {
    this._basePath = path;
  }

  /**
   * Method to create a write stream to the path obtained by attaching the provided filename to the basepath
   *
   * @param {FileRecord} fileRecord The name with which teh file has to be saved
   * @returns {WriteStream} A stream which can be used to write the file to the bucket
   */
  public writeStream(fileRecord: FileRecord) {
    console.log("seems to be in local");
    return createWriteStream(`${this._basePath}/${fileRecord.hash}${fileRecord.fileType? `.${fileRecord.fileType.split('/')[1]}` : ''}`);
  }

  /**
   * Method to get a signed URL to read the file
   *
   * @param {FileRecord} file An instance of the Files DB Model whose signed URL has to be obtained
   * @returns {string} The signed URL to be used for accessing the file
   */
  public getSignedUrl(file: FileRecord): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
    return Promise.resolve(`${config.rootURL}/${config.mediaURI}/${file.hash}${file.fileType? `.${file.fileType.split('/')[1]}` : ''}`);
  }
}
