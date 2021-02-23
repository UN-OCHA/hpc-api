import { Brand } from "../../utils/branding";
import Base, { IBase } from "./common/Base";
import db from '../index';

export enum AuthGranteeType {
    user = 'user'
}

export interface IAuthGrantee extends IBase {
    id:Brand<
        number,
        { readonly s: unique symbol },
        'AuthGrantee ID'
    >;
    type: AuthGranteeType;
    granteeId: number;
}

export type ICreateAuthGrantee = Omit<IAuthGrantee, 'id' | keyof IBase> & Partial<Pick<IAuthGrantee, keyof IBase>>;
export type IUpdateAuthGrantee = Partial<Omit<IAuthGrantee, 'id'>>; 

export default class AuthGrantee extends Base implements IAuthGrantee {

    static TableName = 'authGrantee';

    id: IAuthGrantee['id'];
    type: AuthGranteeType;
    granteeId: number;

    constructor(data: ICreateAuthGrantee & Partial<Pick<IAuthGrantee, 'id'>> = null) {
        super();
        this.id = data?.id;
        this.type = data?.type,
        this.granteeId = data?.granteeId
    }

    public async save() {
        if (this.id) {
            await db('authGrantee').update({
                type: this.type,
                granteeId: this.granteeId,
                updatedAt: this.updatedAt
            }).where({
                id: this.id
            });
        } else {
            const [res] = await db('authGrantee').insert({
                type: this.type,
                granteeId: this.granteeId,
            }).returning('*');
            this.id = res.id;
        }
        return Promise.resolve(true);
    }

    getTableName() {
        return AuthGrantee.TableName;
    }

    static async findOne(whereObj: Partial<IAuthGrantee>) {
        const rawResult = await Base.findOneGeneric(db('authGrantee'), whereObj);
        return new AuthGrantee(rawResult);
    }
}
