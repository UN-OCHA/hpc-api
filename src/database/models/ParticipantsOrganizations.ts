import Participant from "./Participant";
import Organization from "./Organization";
import { Brand } from "../../utils/branding";
import Base, { IBase } from "./common/Base";
import db from '../index';

export interface IParticipantOrganization extends IBase {
  id: Brand<
    number,
    { readonly s: unique symbol },
    "participantOrganizations ID"
  >;
  validated: boolean;
  participantId: Participant["id"];
  organizationId: Organization["id"];
}

export type ICreateParticipantOrganization = Pick<
  IParticipantOrganization,
  "participantId" | "organizationId"
> &
  Partial<Pick<IParticipantOrganization, "validated" | keyof IBase>>;
export type IUpdateParticipantOrganization = Partial<
  Omit<IParticipantOrganization, "id">
>;

export default class ParticipantOrganization
  extends Base
  implements IParticipantOrganization {

  static TableName = 'authGrant';

  id: IParticipantOrganization["id"];
  validated: IParticipantOrganization["validated"];
  participantId: IParticipantOrganization["participantId"];
  organizationId: IParticipantOrganization["organizationId"];

  private _participantInst: Participant;

  set participantInst(data: Participant) {
    this.participantId = data.id;
    this._participantInst = data;
  }
  get participantInst(): Participant {
    return this._participantInst;
  }

  private _organizationInst: Organization;

  set organizationInst(data: Organization) {
    this.organizationId = data.id;
    this._organizationInst = data;
  }
  get organizationInst(): Organization {
    return this._organizationInst;
  }
  
  public async save() {
    if (this.id) {
      await db('participantOrganization')
        .update({
          validated: this.validated,
          participantId: this.participantId,
          organizationId: this.organizationId,
        })
        .where({
          id: this.id,
        });
    } else {
      const [res] = await db('participantOrganization')
        .insert({
          validated: this.validated,
          participantId: this.participantId,
          organizationId: this.organizationId,
        })
        .returning("*");
      this.id = res.id;
    }
    return Promise.resolve(true);
  }

  getTableName() {
    return ParticipantOrganization.TableName;
  }
}
