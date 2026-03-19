import {describe, beforeEach, it, expect} from '@jest/globals';
import SearchQuery, {ISearchQueryOrder} from './SearchQuery';

describe('SearchQuery', () => {
    let searchQuery: SearchQuery<any>;
    let normalizeOrderByValue: (orderValue: string | ISearchQueryOrder, direction: 'asc' | 'desc') => ISearchQueryOrder;

    beforeEach(() => {
        searchQuery = new SearchQuery();
        searchQuery.alias('model');
        // eslint-disable-next-line
        normalizeOrderByValue = searchQuery['normalizeOrderByValue'].bind(searchQuery);
    });

    describe('normalizeOrderByValue', () => {
        it('should normalized orderValue', () => {
            const orderValue: ISearchQueryOrder = {
                name: 'asc',
                'model.email': 'desc',
                'model.relation.age': 'asc',
                'model_relation.city': 'desc',
                'model.relation1.relation2.address': 'asc',
                'model_relation1_relation2.country': 'desc',
                'model_relation1_relation2.relation3.field': 'asc',
                '"model"."createdTime"': 'asc',
                'model."updatedTime"': 'desc',
                '"model".deleteTime': 'desc',
                model_name: 'asc',
                model_relation_name: 'asc',
            };

            const result = normalizeOrderByValue(orderValue, 'asc');

            expect(result).toEqual({
                '"model"."name"': 'asc',
                '"model"."email"': 'desc',
                '"model_relation"."age"': 'asc',
                '"model_relation"."city"': 'desc',
                '"model_relation1_relation2"."address"': 'asc',
                '"model_relation1_relation2"."country"': 'desc',
                '"model_model_relation1_relation2_relation3"."field"': 'asc',
                '"model"."createdTime"': 'asc',
                '"model"."updatedTime"': 'desc',
                '"model"."deleteTime"': 'desc',
                '"model_name"': 'asc',
                '"model_relation_name"': 'asc',
            });
        });
    });
});
