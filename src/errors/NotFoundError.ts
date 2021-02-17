import { ExtendableError } from "./common/ExtendableError";

export class NotFoundError extends ExtendableError {
    constructor(message: any, namespace: any){
        super(message);
        this.namespace = namespace;
    }
    namespace: string;
}