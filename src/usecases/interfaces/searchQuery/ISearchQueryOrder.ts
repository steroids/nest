import {LiteralUnion, ModelFieldPath} from './helpers';

export type ISearchQueryOrderDirection = 'asc' | 'desc';

/** A model field path accepted by `orderBy` and `addOrderBy`. */
export type ISearchQueryOrderField<TModel> = LiteralUnion<ModelFieldPath<TModel>>;

/** Order directions keyed by runtime-resolved query aliases. Returned by `getOrderBy`. */
export type ISearchQueryOrder = Record<string, ISearchQueryOrderDirection>;

/** Object form accepted by `orderBy` and `addOrderBy`. */
export type ISearchQueryOrderObject<TModel> = Partial<Record<
    ISearchQueryOrderField<TModel>,
    ISearchQueryOrderDirection
>>;

/** String or object form accepted by `orderBy` and `addOrderBy`. */
export type ISearchQueryOrderValue<TModel> = ISearchQueryOrderField<TModel> | ISearchQueryOrderObject<TModel>;
