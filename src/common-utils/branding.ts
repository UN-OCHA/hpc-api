/**
 * This type allows us to restrict assignments of other types.
 *
 * For example,
 * to prevent us using IDs for one table field as an ID for another,
 * we can define branded types for the ID fields of two different tables,
 * which will prevent us using the ID of one table as the ID of another:
 *
 * ```
 * type IDA = Brand<number, { readonly s: unique symbol }, 'ID for table a'>;
 * type IDB = Brand<number, { readonly s: unique symbol }, 'ID for table b'>;
 *
 * const a: IDA = createBrandedValue(3);
 * const b: IDB = a; // <-- this will cause a type error
 * ```
 */
export type Brand<T, S extends { s: symbol }, Label extends string = ''> = T & {
  readonly __brand__: S;
  readonly __label__: Label;
};

export const createBrandedValue = <T, B extends Brand<T, any, any>>(v: T): B =>
  v as B;
