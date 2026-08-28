import {LiteralUnion} from './helpers';

/** A model field name accepted by `select`, `addSelect`, and `excludeSelect`. */
export type ISearchQuerySelect<TModel> = LiteralUnion<keyof TModel & string>;
