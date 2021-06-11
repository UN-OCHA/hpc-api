import { DbModels } from '../data-providers/postgres/models';

export default interface Context {
  models: DbModels;
}
