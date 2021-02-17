import { Application, Request, Response } from 'express';

import FileRecord from '../../models/FileRecord';
import FileService from '../../services/FileService';
import * as config from '../../config';

/* Create an instance of fileService so as to avoid of re-creating on every request */
const fileService = new FileService();

export default (app: Application) => {
  /**
   * Route serving signed URL for files.
   * File name serves as keys and are used for obtaining details required for generating signed URLs
   *
   * @name /media/:assignmentId/:fileName
   * @function
   * @inner
   * @param {string} path - Express path
   * @param {callback} middleware - Express middleware.
   */
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
  app.get(`/${config.mediaURI}/:assignmentId/:fileHash`, async (req: Request, res: Response) => {
    // eslint-disable-next-line prefer-destructuring
    const fileHash = req.params.fileHash;
    const assignmentId = req.params.assignmentId
    if (!fileHash) {
      return res.status(400).send('Invalid File Name');
    }
    if (!assignmentId) {
      return res.status(400).send('Invalid Assignment ID');
    }
    // TODO: Add authentication and authorization logic
    const file = await FileRecord.findOne({
        where: {
            hash: fileHash
        }
    })
    if (!file) {
      return res.status(404).send('File Not Found');
    }
    const signedUrl = await fileService.getSignedUrl(file, 1200);
    return res.redirect(signedUrl);
  });
};
