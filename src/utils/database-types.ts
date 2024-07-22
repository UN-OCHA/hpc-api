import { FieldDefinition, InstanceDataOf } from "@unocha/hpc-api-core/src/db/util/model-definition";
import { AnyModel, InstanceOfModel } from "@unocha/hpc-api-core/src/db/util/types";

export type OrderByCond<T> = {
  column: keyof T;
  order?: 'asc' | 'desc';
} & {
  raw?: string;
};

export type OrderBy<F extends FieldDefinition> = {
  column: keyof InstanceDataOf<F>;
  order?: 'asc' | 'desc';
  nulls?: 'first' | 'last';
};
