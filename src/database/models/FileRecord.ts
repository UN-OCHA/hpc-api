import Base, { IBase } from "./common/Base";
import db from '../index';
import { FileStorageNamespace } from "../../types/FileStorageNamespace";

export interface IFileRecord extends IBase {
    namespace: string;
    hash: string;
    fileType: string | null;
    metadata: Record<string, any> | null;
}

export type ICreateFileRecord = Pick<IFileRecord, 'namespace' | 'hash'> & Partial<Pick<IFileRecord, 'fileType' | 'metadata' | keyof IBase>>;
export type IUpdateFileRecord = Partial<IFileRecord>;

export default class FileRecord extends Base implements IFileRecord {

    static TableName = 'fileRecord';

    namespace: IFileRecord['namespace'];
    hash: IFileRecord['hash'];
    fileType: IFileRecord['fileType'];
    metadata: IFileRecord['metadata'];

    constructor(data?: IFileRecord) {
        super();
        this.namespace = data?.namespace;
        this.hash = data?.hash;
        this.fileType = data?.fileType;
        this.metadata = data?.metadata;
        this.createdAt = data?.createdAt;
        this.updatedAt = data?.updatedAt;
    }

    public async save(create = false) {
        if (create) {
            await db('fileRecord').insert({
                namespace: this.namespace,
                hash: this.hash,
                fileType: this.fileType,
                metadata: this.metadata,
            }).returning('*');
        } else {
            await db('fileRecord').update({
                fileType: this.fileType,
                metadata: this.metadata,
            }).where({
                namespace: this.namespace,
                hash: this.hash,
            });
        }
        return Promise.resolve(true);
    }

    static async listFilesInNamespace(namespace: FileStorageNamespace) {
        const rawFileRecords = await db('fileRecord').select('*').where({
            namespace: JSON.stringify(namespace)
        });
        return rawFileRecords.map(rawFileRecord => new FileRecord(rawFileRecord));
    }

    getTableName() {
        return FileRecord.TableName;
    }

    static async findOne(whereObj: Partial<IFileRecord>) {
        const rawResult = await Base.findOneGeneric(db('fileRecord'), whereObj);
        return new FileRecord(rawResult);
      }
}
