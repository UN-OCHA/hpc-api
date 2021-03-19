import { Brand } from "../../utils/branding";
import Base, { IBase } from './common/Base';
import db from '../index';

export interface ILocation extends IBase {
    id: Brand<
        number,
        { readonly s: unique symbol },
        'Location ID'
    >;
    externalId: string;
    name: string;
    adminLevel: number;
    latitude: number;
    longitude: number;
    iso3: string;
    pcode: string;
    validOn: number;
    status: string;
    itosSync: boolean;
}

export type ICreateLocation = Omit<ILocation, 'id' |'itosSync' | keyof IBase> & Partial<Pick<ILocation, 'id' | 'itosSync' | keyof IBase>>;
export type IUpdateLocation = Partial<Omit<ILocation, 'id'>>;

export default class Location extends Base implements ILocation {

    static TableName = 'location';

    id: ILocation['id'];
    externalId: ILocation['externalId'];
    name: ILocation['name'];
    adminLevel: ILocation['adminLevel'];
    latitude: ILocation['latitude'];
    longitude: ILocation['longitude'];
    iso3: ILocation['iso3'];
    pcode: ILocation['pcode'];
    validOn: ILocation['validOn']
    status: ILocation['status'];
    itosSync: ILocation['itosSync'];

    public async save() {
        if (this.id) {
            await db('location').update({
                externalId: this.externalId,
                name: this.name,
                adminLevel: this.adminLevel,
                latitude: this.latitude,
                longitude: this.longitude,
                iso3: this.iso3,
                pcode: this.pcode,
                validOn: this.validOn,
                status: this.status,
                itosSync: this.itosSync,
            }).where({
                id: this.id
            });
        } else {
            const [res] = await db('location').insert({
                externalId: this.externalId,
                name: this.name,
                adminLevel: this.adminLevel,
                latitude: this.latitude,
                longitude: this.longitude,
                iso3: this.iso3,
                pcode: this.pcode,
                validOn: this.validOn,
                status: this.status,
                itosSync: this.itosSync,
            }).returning('*');
            this.id = res.id;
        }
        return Promise.resolve(true);
    }

    getTableName() {
        return Location.TableName;
    }
}
