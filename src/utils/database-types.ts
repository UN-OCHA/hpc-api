import type {
  FieldDefinition,
  InstanceDataOf,
} from '@unocha/hpc-api-core/src/db/util/model-definition';

export type OrderByCond<T> = {
  column: keyof T;
  order?: 'asc' | 'desc';
} & {
  raw?: string;
};

export type OrderBy<F extends FieldDefinition> = {
  column: keyof InstanceDataOf<F>;
  order?: 'asc' | 'desc';
};
