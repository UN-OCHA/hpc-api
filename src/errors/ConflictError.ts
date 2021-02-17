import { ExtendableError } from './common/ExtendableError';

export class ConflictError extends ExtendableError {
    constructor(message: any, namespace: any, timestamp?: Date, otherUser?: string) {
        super(message);
        this.namespace = namespace;
        this.timestamp = timestamp.toISOString();
        this.otherUser = otherUser;
    }
    namespace: string;
    timestamp: string;
    otherUser: string;
}