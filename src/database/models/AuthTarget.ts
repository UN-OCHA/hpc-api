import { registerEnumType } from "type-graphql";

import AuthGrant from './AuthGrant';
import AuthInvite from './AuthInvite';
import { Brand } from "../../utils/branding";
import Base, { IBase } from "./common/Base";
import db from '../index';

enum AuthTargetType {
    global = 'global',
    operation = 'operation',
    operationCluster = 'operationCluster',
    plan = 'plan',
    governingEntity = 'governingEntity',
}

registerEnumType(AuthTargetType, {
    name: 'AuthTargetType',
    description: 'Authentication Target Types',
});

export interface IAuthTarget extends IBase {
    id: Brand<
        number,
        { readonly s: unique symbol },
        'AuthTarget ID'
    >;
    type: AuthTargetType;
    targetId: number | null;
}

export type ICreateAuthTarget = Omit<IAuthTarget, 'id' | keyof IBase> & Partial<Pick<IAuthTarget, keyof IBase>>;
export type IUpddateAuthTarget = Partial<Omit<IAuthTarget, 'id'>>;

export default class AuthTarget extends Base implements IAuthTarget {

    static TableName = 'authTarget';

    id: IAuthTarget['id'];
    type: IAuthTarget['type'];
    targetId: IAuthTarget['targetId'];

    constructor(data?: IAuthTarget){
        super();
        this.id = data?.id;
        this.type = data?.type;
        this.targetId = data?.targetId;
    }

    grant?: AuthGrant;
    invites?: AuthInvite[];

    public async save() {
        if (this.id) {
            await db('authTarget').update({
                type: this.type,
                targetId: this.targetId,
            }).where({
                id: this.id
            });
        } else {
            const [res] = await db('authTarget').insert({
                type: this.type,
                targetId: this.targetId,
            }).returning('*');
            this.id = res.id;
        }
        return Promise.resolve(true);
    }

    getTableName() {
        return AuthTarget.TableName;
    }
}
