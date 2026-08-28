import {LiteralUnion, ModelRelationPath} from './helpers';

export type ISearchQueryWithSelect = string | string[];

/** A relation path, optionally followed by a relation alias, accepted by `with` and `withNoJoin`. */
export type ISearchQueryWithRelation<TModel> = LiteralUnion<
    ModelRelationPath<TModel> | `${ModelRelationPath<TModel>} ${string}`
>;
/** Object form accepted by `with` and `withNoJoin`. */
export type ISearchQueryWithRelationsObject<TModel> = Record<string, ISearchQueryWithSelect>
    & Partial<Record<ModelRelationPath<TModel>, ISearchQueryWithSelect>>;
/** String, array, or object form accepted by `with` and `withNoJoin`. */
export type ISearchQueryWithValue<TModel> = ISearchQueryWithRelation<TModel>
    | ISearchQueryWithRelation<TModel>[]
    | ISearchQueryWithRelationsObject<TModel>;
export type ISearchQueryRelationOptions = {
    alias: string | null,
    select: ISearchQueryWithSelect,
};
