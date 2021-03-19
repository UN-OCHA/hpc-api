import AuthInvite from "./AuthInvite";
import AuthGrantLog from "./AuthGrantLog";
import { Brand } from "../../utils/branding";
import Base, { IBase } from "./common/Base";
import db from "../index";
import AuthGrantee, { AuthGranteeType } from "./AuthGrantee";
import AuthGrant from "./AuthGrant";

export interface IParticipant extends IBase {
  id: Brand<number, { readonly s: unique symbol }, "Participant ID">;
  hidId: string;
  email: string;
  name_given: string;
  name_family: string;
}

export type ICreateParticipant = Omit<IParticipant, "id" | keyof IBase> &
  Partial<Pick<IParticipant, keyof IBase>>;
export type IUpdateParticipant = Partial<Omit<IParticipant, "id">>;

export default class Participant extends Base implements IParticipant {

  static TableName = 'participant';

  id: IParticipant["id"];
  hidId: IParticipant["hidId"];
  email: IParticipant["email"];
  name_given: IParticipant["name_given"];
  name_family: IParticipant["name_family"];

  constructor(data?: ICreateParticipant & Partial<Pick<IParticipant, 'id'>>) {
    super();
    this.id = data?.id;
    this.hidId = data?.hidId;
    this.email = data?.email;
    this.name_family = data?.name_family;
    this.name_given = data?.name_given;
  }

  activateInvitesForEmail = async (email: string) => {
    const rawInvites = await db("authInvite").select("*").where({
      email,
    });
    const invites = rawInvites.map((rawInvite) => new AuthInvite(rawInvite));

    // Activate any invitations
    if (invites.length > 0) {
      const grantee = new AuthGrantee();
      grantee.type = AuthGranteeType.user;
      grantee.granteeId = this.id;
      await grantee.save();
      for (const invite of invites) {
        const target = invite.targetInst;
        /* istanbul ignore if - should not be possible due to sequelize constraints */
        if (!target) {
          throw new Error("missing target");
        }
        const authGrant = new AuthGrant();
        authGrant.granteeInst = grantee;
        authGrant.targetInst = target;
        authGrant.roles = invite.roles;
        await authGrant.save(true);
        const authGrantLog = new AuthGrantLog();
        authGrantLog.granteeInst = grantee;
        authGrantLog.targetInst = target;
        authGrantLog.newRoles = invite.roles;
        authGrantLog.actor = invite.actor;
      }
    }
    await AuthInvite.deleteByEmail(email);
  };

  public async save() {
    if (this.id) {
      await db('participant')
        .update({
          hidId: this.hidId,
          email: this.email,
          name_given: this.name_given,
          name_family: this.name_family,
        })
        .where({
          id: this.id,
        });
    } else {
      const [res] = await db('participant')
        .insert({
          hidId: this.hidId,
          email: this.email,
          name_given: this.name_given,
          name_family: this.name_family,
        })
        .returning("*");
      this.id = res.id;
    }
    return Promise.resolve(true);
  }

  getTableName() {
    return Participant.TableName;
  }

  static async findAllParticipants(where: Partial<IParticipant>) {
    console.log("executing the query");
    const rawParticipants = await db('participant').select('*').where(where).whereNotNull('email');
    return rawParticipants.map(rawParticipant => new Participant(rawParticipant));
  }

  static async findOne(whereObj: Partial<IParticipant>) {
    const rawResult = await Base.findOneGeneric(db('participant'), whereObj);
    return new Participant(rawResult);
  }
}
