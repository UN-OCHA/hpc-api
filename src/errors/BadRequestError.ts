import { ErrorResponse, ExtendableError } from "./common/ExtendableError";

export class BadRequestError extends ExtendableError {
    constructor(
      message:
        | ErrorResponse
        | {
          message: ErrorResponse
        },
      namespace: any,
      originalError?: any
    ){
        super(message as string);
        this.namespace = namespace;
        this._originalError = originalError;
    };
    namespace: string;
    _originalError: any;
  }