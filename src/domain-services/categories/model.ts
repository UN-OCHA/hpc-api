import { type Op } from '@unocha/hpc-api-core/src/db/util/conditions';

export type ShortcutCategoryFilter = {
  category: string;
  operation: typeof Op.IN | typeof Op.NOT_IN;
  id?: number;
};
