import {IsNestedValue, LiteralUnion, PreviousDepth, Primitive, Unpacked} from './helpers';

type SearchQueryOrderFieldPath<TModel, TDepth extends number = 5> =
    [TDepth] extends [0]
        ? never
        : TModel extends Primitive | Date | Function | Buffer
            ? never
            : {
                [TKey in keyof TModel & string]:
                | TKey
                | (IsNestedValue<TModel[TKey]> extends true
                    ? `${TKey}.${SearchQueryOrderFieldPath<Unpacked<TModel[TKey]>, PreviousDepth[TDepth] & number>}`
                    : never)
            }[keyof TModel & string];

export type ISearchQueryOrderDirection = 'asc' | 'desc';
export type ISearchQueryOrderField<TModel> = LiteralUnion<SearchQueryOrderFieldPath<TModel>>;
export type ISearchQueryOrder<TModel = any> = Record<string, ISearchQueryOrderDirection>;
export type ISearchQueryOrderInput<TModel> = ISearchQueryOrder<TModel>
    & Partial<Record<SearchQueryOrderFieldPath<TModel>, ISearchQueryOrderDirection>>;
export type ISearchQueryOrderValue<TModel> = ISearchQueryOrderField<TModel> | ISearchQueryOrderInput<TModel>;
