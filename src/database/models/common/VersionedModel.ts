import { AfterLoad, QueryFailedError, Repository } from "typeorm";
import { DatabaseError } from 'pg-protocol';

import Base from './Base';
import Participant from '../Participant'; 
import VersionModel, {IVersionModel, ICreateVersionModel, IUpdateVersionModel} from "./VersionModel";
import db from '../../index'

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

    public id: number;

    public versionModelInstance: VersionModel<Data>;
    public abstract saveData(data: Data);
    
    constructor() {
        super();
        this.versionModelInstance = new VersionModel<Data>();
    }

    public async Create(data: Data, modifiedBy: Participant['id'] | null) {
        await this.saveData(data);
        const tableName = this.getTableName();
        this.versionModelInstance = new VersionModel((await db<IVersionModel<Data>>(`${tableName}${VersionModel.Suffix}`).insert({
            root: this.id,
            version: 1,
            modifiedBy: modifiedBy || undefined,
            isLatest: true,
            data: data as any,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning('*'))[0]);
        return this;
    }

    public async Update(currentVersion: number, data: Data, modifiedBy: Participant['id'] | null) {
        const tableName = this.getTableName();
        const versionTableName = `${tableName}${VersionModel.Suffix}`;
        const prev = await db<IVersionModel<Data>>(versionTableName).first('*').where({
            root: this.id,
            version: currentVersion
        });
        if (!prev) {
            throw new Error(`Could not find version ${currentVersion} of ${tableName} with id ${this.id}`);
        }
        if (!prev.isLatest) {
            throw new ConcurrentModificationError(
                `version ${prev.version} is not the latest version`
            );
        }
        await this.saveData(data);
        // Make new version not the latest
        await db<IVersionModel<Data>>(versionTableName).where({
            root: this.id,
            version: prev.version
        }).update({
            isLatest: false,
            updatedAt: new Date()
        });
        // Create new version
        try {
            this.versionModelInstance = new VersionModel((await db<IVersionModel<Data>>(versionTableName).insert({
                root: this.id,
                version: 1,
                modifiedBy: modifiedBy || undefined,
                isLatest: true,
                data: data as any,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning('*'))[0]);
        } catch(err) {
            if (isQueryFailedError(err) && err.code === PG_UNIQUE_CONSTRAINT_VIOLATION) {
                throw new ConcurrentModificationError('New version already created');
            } else {
                throw err;
            }
        }
    }

    async loadVersionData() {
        const tableName = this.getTableName();
        this.versionModelInstance = new VersionModel(await db<IVersionModel<Data>>(`${tableName}${VersionModel.Suffix}`).first('*').where({
            root: this.id,
            isLatest: true
        }));
        if (!this.versionModelInstance) {
            throw new Error("Couldn't find the latest version");
        }
    }

    public async save(): Promise<boolean> {
        throw new Error("This is a Versioned Model, please use Create or Update methods");
    }
}
