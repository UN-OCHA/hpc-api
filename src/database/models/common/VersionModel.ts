import Participant from "../Participant";
import Base, { IBase } from "./Base";
import db from '../../index'

export interface IVersionModel<Data> extends IBase {
    root: number;
    modifiedBy: Participant['id'] | null;
    version: number;
    isLatest: boolean;
    data: Data;
}

export type ICreateVersionModel<Data> = Omit<IVersionModel<Data>, 'modifiedBy'> & Partial<Pick<IVersionModel<Data>, 'modifiedBy'>>;
export type IUpdateVersionModel<Data> = Partial<IVersionModel<Data>>;

export default class VersionModel<Data> extends Base implements IVersionModel<Data> {

    public static Suffix = 'Version'

    root: number;
    modifiedBy: Participant['id'];
    version: number;
    isLatest: boolean;
    data: Data;

    modifiedByParticipant?: Participant;

    constructor(data: IVersionModel<Data> = null, eager = false) {
        super();
        this.root = data?.root;
        this.modifiedBy = data?.modifiedBy;
        this.version = data?.version;
        this.isLatest = data?.isLatest;
        this.data = data?.data;
    }

    public async loadRelations() {
        await this.loadParticipant();
        return true;
    }

    public async loadParticipant() {
        this.modifiedByParticipant = new Participant(await db('participant').first('*').where({
            id: this.modifiedBy
        }));
        return this.modifiedByParticipant;
    }

    public save() {
        // This is implemented in the Versioned Model class
        return Promise.resolve(true);
    }
}