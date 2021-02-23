import Base, { IBase } from "./common/Base";
import Participant from "./Participant";
import db from '../index';

export interface IAuthToken extends IBase {
    tokenHash: string;
    participant: Participant['id'];
    expires: Date;
}

export type ICreateAuthToken = Omit<IAuthToken, keyof IBase> & Partial<Pick<IAuthToken, keyof IBase>>;
export type IUpdateAuthToken = Partial<Omit<IAuthToken, 'id'>>;

export default class AuthToken extends Base implements IAuthToken {

    static TableName = 'authToken';

    tokenHash: IAuthToken['tokenHash'];
    participant: IAuthToken['participant'];
    expires: IAuthToken['expires'];

    constructor(data?: IAuthToken) {
        super();
        this.tokenHash = data?.tokenHash;
        this.participant = data?.participant;
        this.expires = data?.expires;
        this.createdAt = data?.createdAt;
        this.updatedAt = data?.updatedAt;
    }

    private _participantInst: Participant;

    set participantInst(data: Participant) {
        this.participant = data.id;
        this._participantInst = data;
    }

    get participantInst(): Participant {
        return this._participantInst;
    }

    public static associations: {
        'participant': 'participantInst',
    }

    public async save(create = false) {
        if (create) {
            await db('authToken').insert({
                tokenHash: this.tokenHash,
                participant: this.participant,
                expires: this.expires,
            }).returning('*');
        } else {
            await db('authToken').update({
                tokenHash: this.tokenHash,
                participant: this.participant,
                expires: this.expires,
            }).where({
                tokenHash: this.tokenHash
            });
        }
        return Promise.resolve(true);
    }

    getTableName() {
        return AuthToken.TableName;
    }

    static async findOneWithParticipant(whereObj: Partial<IAuthToken>) {
        const rawResult = await Base.findOneGeneric(db('authToken'), whereObj).innerJoin('participant', 'participant.id', '=', 'authToken.participant');
        const authTokenInst = new AuthToken(rawResult);
        authTokenInst.participantInst = new Participant(rawResult);
        return authTokenInst;
    }

}
