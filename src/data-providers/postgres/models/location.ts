import { LocationStatus } from '../../../domain-services/location/graphql/types';
import { createModel, TableBaseWithTimeStamps } from './common/base';

export interface LocationTable extends TableBaseWithTimeStamps {
  externalId?: string;
  name?: string;
  adminLevel: number;
  latitude?: number;
  longitude?: number;
  parentId?: number;
  iso3?: string;
  pcode?: string;
  status?: LocationStatus;
  validOn?: number;
  itosSync: boolean;
}

export const locationModel = createModel<LocationTable>('location');
