import Participant from "./Participant";
import Location from "./Location";
import { Brand } from "../../utils/branding";
import Base, { IBase } from "./common/Base";
import db from "../index";

export interface IParticipantLocation extends IBase {
  id: Brand<number, { readonly s: unique symbol }, "ParticipantCountry ID">;
  validated: boolean;
  participantId: Participant["id"];
  locationId: Location["id"];
}

export type ICreateParticipantLocation = Omit<
  IParticipantLocation,
  "id" | keyof IBase
> &
  Partial<Pick<IParticipantLocation, keyof IBase>>;
export type IUpdateParticipantLocation = Partial<
  Omit<IParticipantLocation, "id">
>;

export default class ParticipantLocation
  extends Base
  implements IParticipantLocation {

  static TableName = 'participantLocation';

  id: IParticipantLocation["id"];
  validated: IParticipantLocation["validated"];
  participantId: IParticipantLocation["participantId"];
  locationId: IParticipantLocation["locationId"];

  private _participantInst: Participant;

  set participantInst(data: Participant) {
    this.participantId = data.id;
    this._participantInst = data;
  }
  get participantInst(): Participant {
    return this._participantInst;
  }

  private _locationInst: Location;

  set locationInst(data: Location) {
    this.locationId = data.id;
    this._locationInst = data;
  }
  get locationInst(): Location {
    return this._locationInst;
  }

  public async save() {
    if (this.id) {
      await db("participantCountry")
        .update({
          validated: this.validated,
          participantId: this.participantId,
          locationId: this.locationId,
        })
        .where({
          id: this.id,
        });
    } else {
      const [res] = await db("participantCountry")
        .insert({
          validated: this.validated,
          participantId: this.participantId,
          locationId: this.locationId,
        })
        .returning("*");
      this.id = res.id;
    }
    return Promise.resolve(true);
  }

  getTableName() {
    return ParticipantLocation.TableName;
  }
}
