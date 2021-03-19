import AuthGrantee from './AuthGrantee';
import AuthTarget from "./AuthTarget";
import Base, { IBase } from './common/Base';
import db from '../index';

export interface IAuthGrant extends IBase {
    target: number;
    grantee: number;
    roles: string[];
}

export type ICreateAuthGrant = Omit<IAuthGrant, keyof IBase> & Partial<Pick<IAuthGrant, keyof IBase>>;
export type IUpdateAuthGrant = Partial<IAuthGrant>;

export default class AuthGrant extends Base implements IAuthGrant {

    static TableName = 'authGrant';

    target: IAuthGrant['target'];
    grantee: IAuthGrant['grantee'];
    roles: IAuthGrant['roles'];

    constructor(data: ICreateAuthGrant | null = null) {
        super();
        this.target = data?.target;
        this.grantee = data?.grantee;
        this.roles = data?.roles;
    }

    private _targetInst: AuthTarget;

    set targetInst(data: AuthTarget) {
        this.target = data.id;
        this._targetInst = data;
    }

    get targetInst(): AuthTarget {
        return this._targetInst;
    }

    private _granteeInst: AuthGrantee;

    set granteeInst(data: AuthGrantee) {
        this.grantee = data.id;
        this._granteeInst = data;
    }

    get granteeInst(): AuthGrantee {
        return this._granteeInst;
    }

    public async save(create = false) {
        if (create) {
            await db('authGrant').insert({
                target: this.target,
                grantee: this.grantee,
                roles: this.roles,
            }).returning('*');
        } else {
            await db('authGrant').update({
                roles: this.roles,
            }).where({
                target: this.target,
                grantee: this.grantee,
            });
        }
        return Promise.resolve(true);
    }

    getTableName() {
        return AuthGrant.TableName;
    }

    static async findOne(whereObj: Partial<IAuthGrant>) {
        const rawResult = await Base.findOneGeneric(db('authGrant'), whereObj);
        return new AuthGrant(rawResult);
    }

    static async findWithTarget(whereObj: Partial<IAuthGrant>) {
        const rawResults = await Base.findGeneric(db('authGrant'), whereObj).innerJoin('authTarget', 'authTarget.id', '=', 'authGrant.target');
        return rawResults.map(rawResult => {
            const obj = new AuthGrant(rawResult);
            obj.targetInst = new AuthTarget(rawResult);
            return obj;
        });
    }
}
