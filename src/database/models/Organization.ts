import { Brand } from "../../utils/branding";
import Base, { IBase } from "./common/Base";
import db from "../index";

export interface IOrganization extends IBase {
  id: Brand<number, { readonly s: unique symbol }, "Organization ID">;
  name: string;
  nativeName: string | null;
  abbreviation: string;
  url: string | null;
  comments: string | null;
  verified: boolean;
  notes: string | null;
  active: boolean;
  collectiveInd: boolean;
  newOrganizationId: Organization["id"] | null;
  parentID: Organization["id"] | null;
}

export type ICreateOrganization = Pick<
  IOrganization,
  "name" | "abbreviation" | "verified" | "active" | "collectiveInd"
> &
  Partial<
    Omit<
      IOrganization,
      "name" | "abbreviation" | "verified" | "active" | "collectiveInd" | "id"
    >
  >;
export type IUpdateOrganization = Partial<Omit<IOrganization, "id">>;

export default class Organization extends Base implements IOrganization {

  static TableName = 'organization';

  id: IOrganization["id"];
  name: IOrganization["name"];
  nativeName: IOrganization["nativeName"];
  abbreviation: IOrganization["abbreviation"];
  url: IOrganization["url"];
  comments: IOrganization["comments"];
  verified: IOrganization["verified"];
  notes: IOrganization["notes"];
  active: IOrganization["active"];
  collectiveInd: IOrganization["collectiveInd"];
  newOrganizationId: IOrganization["newOrganizationId"];
  newOrganizationInst: Organization;
  parentID: IOrganization["parentID"];
  parentInst: Organization;

  public async save() {
    if (this.id) {
      await db("organization")
        .update({
          name: this.name,
          nativeName: this.nativeName,
          abbreviation: this.abbreviation,
          url: this.url,
          comments: this.comments,
          verified: this.verified,
          notes: this.notes,
          active: this.active,
          collectiveInd: this.collectiveInd,
          newOrganizationId: this.newOrganizationId,
          parentID: this.parentID,
        })
        .where({
          id: this.id,
        });
    } else {
      const [res] = await db("organization")
        .insert({
          name: this.name,
          nativeName: this.nativeName,
          abbreviation: this.abbreviation,
          url: this.url,
          comments: this.comments,
          verified: this.verified,
          notes: this.notes,
          active: this.active,
          collectiveInd: this.collectiveInd,
          newOrganizationId: this.newOrganizationId,
          parentID: this.parentID,
        })
        .returning("*");
      this.id = res.id;
    }
    return Promise.resolve(true);
  }

  getTableName() {
    return Organization.TableName;
  }

  public static categories() {
    // to be implemented
  }
}
