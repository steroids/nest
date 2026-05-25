import {describe, beforeEach, it, expect} from '@jest/globals';
import SearchQuery from './SearchQuery';

describe('SearchQuery', () => {
    let searchQuery: SearchQuery<any>;

    beforeEach(() => {
        searchQuery = new SearchQuery();
        searchQuery.alias('model');
    });

    describe('orderBy', () => {
        it('should resolve field name', () => {
            searchQuery.orderBy('name');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model"."name"': 'asc',
            });
        });

        it('should resolve root alias field path', () => {
            searchQuery.orderBy('model.email');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model"."email"': 'asc',
            });
        });

        it('should resolve root alias relation field path', () => {
            searchQuery.orderBy('model.relation.age');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model_relation"."age"': 'asc',
            });
        });

        it('should resolve relation alias field path', () => {
            searchQuery.orderBy('model_relation.city');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model_relation"."city"': 'asc',
            });
        });

        it('should resolve nested root alias relation field path', () => {
            searchQuery.orderBy('model.relation1.relation2.address');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model_relation1_relation2"."address"': 'asc',
            });
        });

        it('should resolve nested relation alias field path', () => {
            searchQuery.orderBy('model_relation1_relation2.country');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model_relation1_relation2"."country"': 'asc',
            });
        });

        it('should resolve relation alias with nested relation field path', () => {
            searchQuery.orderBy('model_relation1_relation2.relation3.field');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model_model_relation1_relation2_relation3"."field"': 'asc',
            });
        });

        it('should resolve quoted root alias field path', () => {
            searchQuery.orderBy('"model"."createdTime"');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model"."createdTime"': 'asc',
            });
        });

        it('should resolve partially quoted root alias field path', () => {
            searchQuery.orderBy('model."updatedTime"');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model"."updatedTime"': 'asc',
            });
        });

        it('should resolve quoted root alias with unquoted field path', () => {
            searchQuery.orderBy('"model".deleteTime');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model"."deleteTime"': 'asc',
            });
        });

        it('should resolve root alias field', () => {
            searchQuery.orderBy('model_name');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model_name"': 'asc',
            });
        });

        it('should resolve relation alias field', () => {
            searchQuery.orderBy('model_relation_name');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model_relation_name"': 'asc',
            });
        });

        it('should use provided direction for a string field path', () => {
            searchQuery.orderBy('relation.age', 'desc');

            expect(searchQuery.getOrderBy()).toEqual({
                '"model_relation"."age"': 'desc',
            });
        });

        it('should resolve object field paths with their directions', () => {
            searchQuery.orderBy({
                name: 'asc',
                'relation.age': 'desc',
            });

            expect(searchQuery.getOrderBy()).toEqual({
                '"model"."name"': 'asc',
                '"model_relation"."age"': 'desc',
            });
        });
    });
});
