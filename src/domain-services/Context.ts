import { type Database } from '@unocha/hpc-api-core/src/db/type';

export default interface Context {
  models: Database;
}
