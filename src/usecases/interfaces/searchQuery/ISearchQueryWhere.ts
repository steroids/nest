import {ISearchQueryWithRelation} from './ISearchQueryWith';
import {LiteralUnion, ModelFieldPath} from './helpers';

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

/**
 * A model field path accepted by `where`, `andWhere`, `orWhere`, and `filterWhere`,
 * `andFilterWhere`, and `orFilterWhere`.
 */
export type ISearchQueryWhereField<TModel> = LiteralUnion<ModelFieldPath<TModel>>;
/**
 * Object form accepted by `where`, `andWhere`, `orWhere`, and `filterWhere`,
 * `andFilterWhere`, and `orFilterWhere`.
 */
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
