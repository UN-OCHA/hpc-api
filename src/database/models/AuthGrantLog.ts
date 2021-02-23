import AuthGrantee from "./AuthGrantee";
import AuthTarget from "./AuthTarget";
import Participant from "./Participant";
import { Brand } from "../../utils/branding";
import Base, { IBase } from "./common/Base";
import db from '../index';

export interface IAuthGrantLog extends IBase {
    id: Brand<
        number,
        { readonly s: unique symbol },
        'AuthGrantLog ID'
    >;
    target: AuthTarget['id'];
    grantee: AuthGrantee['id'];
    newRoles: string[];
    actor: Participant['id'];
}

export type ICreateAuthGrantLog = Omit<IAuthGrantLog, 'id' | keyof IBase> & Partial<Pick<IAuthGrantLog, keyof IBase>>;
export type IUpdateAuthGrantLog = Partial<Omit<IAuthGrantLog, 'id'>>;

export default class AuthGrantLog extends Base implements IAuthGrantLog {

    static TableName = 'authGrantLog';

    id: IAuthGrantLog['id'];
    target: IAuthGrantLog['target'];
    grantee: IAuthGrantLog['grantee'];
    newRoles: IAuthGrantLog['newRoles'];
    actor: IAuthGrantLog['actor'];

    private _targetInst: AuthTarget;

    get targetInst(): AuthTarget {
        return this._targetInst;
    }

    set targetInst(data: AuthTarget) {
        this.target = data.id;
        this._targetInst = data;
    }

    private _granteeInst: AuthGrantee;

    get granteeInst(): AuthGrantee {
        return this._granteeInst;
    }

    set granteeInst(data: AuthGrantee) {
        this.grantee = data.id;
        this._granteeInst = data;
    }

    private _actorInst: Participant;

    get actorInst(): Participant {
        return this._actorInst;
    }

    set actorInst(data: Participant) {
        this.actor = data.id;
        this._actorInst = data;
    }

    public async save() {
        if (this.id) {
            await db('authGrantLog').update({
                target: this.target,
                grantee: this.grantee,
                newRoles: this.newRoles,
                actor: this.actor,
            }).where({
                id: this.id
            });
        } else {
            const [res] = await db('authGrantLog').insert({
                target: this.target,
                grantee: this.grantee,
                newRoles: this.newRoles,
                actor: this.actor,
            }).returning('*');
            this.id = res.id;
        }
        return Promise.resolve(true);
    }

    getTableName() {
        return AuthGrantLog.TableName;
    }
}
