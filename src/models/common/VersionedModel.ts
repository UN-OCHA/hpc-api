import { AfterLoad, QueryFailedError, Repository } from "typeorm";
import { DatabaseError } from 'pg-protocol';

import Base from './Base';
import { ParticipantId } from '../Participant'; 
import VersionModel from "./VersionModel";

const CONCURRENT_MODIFICATION_ERROR = Symbol('ConcurrentModificationError');
const PG_UNIQUE_CONSTRAINT_VIOLATION = "23505";

const isQueryFailedError = (err: unknown): err is QueryFailedError & DatabaseError =>
  err instanceof QueryFailedError;

class ConcurrentModificationError extends Error {
    public readonly _kind = CONCURRENT_MODIFICATION_ERROR;
  
    public constructor(message: string) {
      super(`ConcurrentModificationError: ${message}`);
    }
}

export default abstract class VersionedModel<Data> extends Base {

    abstract versions: VersionModel<Data>[];

    public abstract getVersionModelRepo(): Repository<VersionModel<Data>>;
    public abstract getVersionedModelRepo(): Repository<VersionedModel<Data>>;
    
    public versionModelInstance: VersionModel<Data>;
    public abstract prepareForSave(data: Data);
    public abstract getName(): string;
    
    constructor() {
        super();
        console.log("about to create the entity schema");
    }

    public async Create(data: Data, modifiedBy: ParticipantId | null) {
        await this.prepareForSave(data);
        await this.save();
        const repo = this.getVersionModelRepo();
        await repo.save({
            root: this.id,
            version: 1,
            modifiedBy: modifiedBy || undefined,
            isLatest: true,
            data: data as any,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return this;
    }

    public async Update(currentVersion: number, data: Data, modifiedBy: ParticipantId | null) {
        const repo = this.getVersionModelRepo();
        const prev = await repo.findOne({
            where: {
                root: this.id,
                version: currentVersion
            }
        });
        if (!prev) {
            throw new Error(`Could not find version ${currentVersion} of ${this.getName()} with id ${this.id}`);
        }
        if (!prev.isLatest) {
            throw new ConcurrentModificationError(
                `version ${prev.version} is not the latest version`
            );
        }
        await this.prepareForSave(data);
        // Make new version not the latest
        await repo.update(
            {
                root: this.id,
                version: prev.version
            }, 
            { 
                isLatest: false,
                updatedAt: new Date()
            }
        );
        // Create new version
        try {
            this.versionModelInstance = await repo.save({
                root: this.id,
                version: prev.version + 1,
                modifiedBy: modifiedBy || undefined,
                isLatest: true,
                data: data as any,
                updatedAt: new Date(),
                createdAt: new Date(),
            })
        } catch(err) {
            if (isQueryFailedError(err) && err.code === PG_UNIQUE_CONSTRAINT_VIOLATION) {
                throw new ConcurrentModificationError('New version already created');
            } else {
                throw err;
            }
        }
        return this.save();
    }

    @AfterLoad()
    async Get() {
        const versionModel = this.getVersionModelRepo();
        this.versionModelInstance = await versionModel.findOne({
            where: {
                root: this.id,
                isLatest: true
            },
            relations: ['modifiedByParticipant']
        });
        if (!this.versionModelInstance) {
            throw new Error("Couldn't find the latest version");
        }
    }
}
