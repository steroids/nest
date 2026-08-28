export type Primitive = string | number | boolean | bigint | symbol | null | undefined;
export type LiteralUnion<TLiteral extends TBase, TBase = string> = TLiteral | (TBase & Record<never, never>);
export type PreviousDepth = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export type Unpacked<TValue> = TValue extends Array<infer TItem> ? NonNullable<TItem> : NonNullable<TValue>;
export type IsNestedValue<TValue> = Unpacked<TValue> extends Primitive | Date | Function | Buffer ? false : true;

/** Union of model field names and nested paths, for example `customer.address.city`. */
export type ModelFieldPath<TModel, TDepth extends number = 5> =
    [TDepth] extends [0]
        ? never
        : TModel extends Primitive | Date | Function | Buffer
            ? never
            : {
                [TKey in keyof TModel & string]:
                | TKey
                | (IsNestedValue<TModel[TKey]> extends true
                    ? `${TKey}.${ModelFieldPath<Unpacked<TModel[TKey]>, PreviousDepth[TDepth] & number>}`
                    : never)
            }[keyof TModel & string];
export type IsRelationValue<TValue> =
    Unpacked<TValue> extends Primitive | Date | Function | Buffer
        ? false
        : 'id' extends keyof Unpacked<TValue> ? true : false;

/** Union of relation field names and nested relation paths, for example `customer.profile`. */
export type ModelRelationPath<TModel, TDepth extends number = 5> =
    [TDepth] extends [0]
        ? never
        : TModel extends Primitive | Date | Function | Buffer
            ? never
            : {
                [TKey in keyof TModel & string]:
                | (TKey extends keyof TModel & (`${string}Id` | `${string}Ids`) ? TKey : never)
                | (IsRelationValue<TModel[TKey]> extends true
                    ? TKey | `${TKey}.${ModelRelationPath<Unpacked<TModel[TKey]>, PreviousDepth[TDepth] & number>}`
                    : never)
            }[keyof TModel & string];
