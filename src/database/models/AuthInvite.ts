import AuthTarget from "./AuthTarget";
import Base, { IBase } from "./common/Base";
import Participant, { IParticipant } from "./Participant";
import db from '../index';

export interface IAuthInvite extends IBase {
    target: AuthTarget['id'];
    email: string;
    roles: string[];
    actor: Participant['id'];
}

export type ICreateAuthInvite = Omit<IAuthInvite, 'id' | keyof IBase> & Partial<Pick<IAuthInvite, keyof IBase>>;
export type IUpdateAuthInvite = Partial<Omit<IAuthInvite, 'id'>>;

export default class AuthInvite extends Base implements IAuthInvite {

    static TableName = 'authInvite';

    target: IAuthInvite['target'];
    email: IAuthInvite['email'];
    roles: IAuthInvite['roles'];
    actor: IAuthInvite['actor'];

    constructor(data?: IAuthInvite) {
        super();
        this.target = data?.target;
        this.email = data?.email;
        this.roles = data?.roles;
        this.actor = data?.actor;
    }

    private _actorInst: Participant;

    get actorInst(): Participant {
        return this._actorInst;
    }

    set actorInst(data: Participant) {
        this.actor = data.id;
        this._actorInst = data;
    }

    private _targetInst: AuthTarget;

    get targetInst(): AuthTarget {
        return this._targetInst;
    }

    set targetInst(data: AuthTarget) {
        this.target = data.id;
        this._targetInst = data;
    }

    public async loadRelations() {
        // problem, overlapping columns
        const result = await db('authInvite').
            innerJoin('participant', 'participant.id', '=', 'authInvite.actor').
            innerJoin('authTarget', 'authTarget.id', '=', 'authInvite.target')
            .select('*');
        this.actorInst = new Participant(result[0]);
        this.targetInst = new AuthTarget(result[0]);
    }

    public async save(create = false) {
        if (create) {
            await db('authInvite').insert({
                target: this.target,
                email: this.email,
                roles: this.roles,
                actor: this.actor,
            }).returning('*');
        } else {
            await db('authInvite').update({
                target: this.target,
                email: this.email,
                roles: this.roles,
                actor: this.actor,
            }).where({
                target: this.target,
                email: this.email,
            });
        }
        return Promise.resolve(true);
    }

    public async delete() {
        await db('authInvite').delete().where({
            target: this.target,
            email: this.email,
        });
    }

    getTableName() {
        return AuthInvite.TableName;
    }

    public static async deleteByEmail(email: IAuthInvite['email']) {
        await db('authInvite').delete().where({
            email
        });
    }
}
