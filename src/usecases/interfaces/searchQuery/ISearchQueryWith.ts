import {IsRelationValue, LiteralUnion, PreviousDepth, Primitive, Unpacked} from './helpers';

type RelationIdField<TModel> = keyof TModel & (`${string}Id` | `${string}Ids`);

type SearchQueryRelationPath<TModel, TDepth extends number = 5> =
    [TDepth] extends [0]
        ? never
        : TModel extends Primitive | Date | Function | Buffer
            ? never
            : {
                [TKey in keyof TModel & string]:
                | (TKey extends RelationIdField<TModel> ? TKey : never)
                | (IsRelationValue<TModel[TKey]> extends true
                    ? TKey | `${TKey}.${SearchQueryRelationPath<Unpacked<TModel[TKey]>, PreviousDepth[TDepth] & number>}`
                    : never)
            }[keyof TModel & string];

export type ISearchQueryWithSelect = string | string[];
export type ISearchQueryWithRelationPath<TModel> = SearchQueryRelationPath<TModel>;
export type ISearchQueryWithRelation<TModel> = LiteralUnion<
    ISearchQueryWithRelationPath<TModel> | `${ISearchQueryWithRelationPath<TModel>} ${string}`
>;
export type ISearchQueryWithRelations<TModel> = Record<string, ISearchQueryWithSelect>
    & Partial<Record<ISearchQueryWithRelationPath<TModel>, ISearchQueryWithSelect>>;
export type ISearchQueryWithValue<TModel> = ISearchQueryWithRelation<TModel>
    | ISearchQueryWithRelation<TModel>[]
    | ISearchQueryWithRelations<TModel>;
export type ISearchQueryRelationOptions = {
    alias: string,
    select: ISearchQueryWithSelect,
};
