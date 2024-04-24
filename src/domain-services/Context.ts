import { type Database } from '@unocha/hpc-api-core/src/db/type';
import type Knex from 'knex';

export default interface Context {
  models: Database;
  connection: Knex;
}
