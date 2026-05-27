import {LiteralUnion} from './helpers';

export type ISearchQuerySelect<TModel> = LiteralUnion<keyof TModel & string>;
