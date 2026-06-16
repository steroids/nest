export type Primitive = string | number | boolean | bigint | symbol | null | undefined;
export type LiteralUnion<TLiteral extends TBase, TBase = string> = TLiteral | (TBase & Record<never, never>);
export type PreviousDepth = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export type Unpacked<TValue> = TValue extends Array<infer TItem> ? NonNullable<TItem> : NonNullable<TValue>;
export type IsNestedValue<TValue> = Unpacked<TValue> extends Primitive | Date | Function | Buffer ? false : true;
export type IsRelationValue<TValue> =
    Unpacked<TValue> extends Primitive | Date | Function | Buffer
        ? false
        : 'id' extends keyof Unpacked<TValue> ? true : false;
