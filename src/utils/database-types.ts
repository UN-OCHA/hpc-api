export type OrderByCond<T> = {
  column: keyof T;
  order?: 'asc' | 'desc';
} & {
  raw?: string;
};

export type OrderBy = {
  column: string;
  order?: 'asc' | 'desc';
};
