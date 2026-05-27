import {ISearchQueryWithRelation} from './ISearchQueryWith';
import {IsNestedValue, LiteralUnion, PreviousDepth, Primitive, Unpacked} from './helpers';

type SearchQueryWhereFieldPath<TModel, TDepth extends number = 5> =
    [TDepth] extends [0]
        ? never
        : TModel extends Primitive | Date | Function | Buffer
            ? never
            : {
                [TKey in keyof TModel & string]:
                | TKey
                | (IsNestedValue<TModel[TKey]> extends true
                    ? `${TKey}.${SearchQueryWhereFieldPath<Unpacked<TModel[TKey]>, PreviousDepth[TDepth] & number>}`
                    : never)
            }[keyof TModel & string];

export type IConditionOperatorSingle = '=' | '>' | '>=' | '=>' | '<' | '<=' | '=<' | 'like' | 'ilike' | 'between'
    | 'in' | 'and' | '&&' | 'or' | '||' | 'not =' | 'not >' | 'not >=' | 'not =>' | 'not <' | 'not <=' | 'not =<'
    | 'not like' | 'not ilike' | 'not between' | 'not in' | 'not and' | 'not &&' | 'not or' | 'not ||' | '@>'
    | 'not @>' | '<@' | 'not <@' | 'overlap' | 'not overlap';
export type IConditionOperatorAndOr = 'and' | '&&' | 'or' | '||' | 'not and' | 'not &&' | 'not or' | 'not ||';
export type IConditionOperatorSubquery = 'some' | 'every' | 'none';
export type ICondition = Record<string, unknown>
    | [IConditionOperatorAndOr, ...any[]]
    | ['filter', ICondition]
    | [IConditionOperatorSingle, string, ...any[]]
    | [IConditionOperatorSubquery, string | string[], ICondition]
    | ICondition[];

export type ISearchQueryWhereField<TModel> = LiteralUnion<SearchQueryWhereFieldPath<TModel>>;
export type ISearchQueryWhereObject<TModel> =
    | Partial<Record<ISearchQueryWhereField<TModel>, unknown>>
    | Record<string, unknown>;
export type ISearchQueryWhereRelation<TModel> = ISearchQueryWithRelation<TModel>
    | ISearchQueryWithRelation<TModel>[];
export type ISearchQueryWhere<TModel = any> =
    | ISearchQueryWhereObject<TModel>
    | [IConditionOperatorAndOr, ...ISearchQueryWhere<TModel>[]]
    | ['filter', ISearchQueryWhere<TModel>]
    | [IConditionOperatorSingle, ISearchQueryWhereField<TModel>, ...unknown[]]
    | [IConditionOperatorSubquery, ISearchQueryWhereRelation<TModel>, ISearchQueryWhere<TModel>]
    | ISearchQueryWhere<TModel>[];
