import {describe, expect, it} from '@jest/globals';
import SearchQuery from './SearchQuery';
import {ISearchQueryWithRelationPath} from '../interfaces/searchQuery/ISearchQueryWith';

class RegionModel {
    id: number;

    name: string;
}

class CountryModel {
    id: number;

    region: RegionModel;
}

class ProfileModel {
    id: number;

    city: string;

    country: CountryModel;
}

class CustomerModel {
    id: number;

    name: string;

    profileId: number;

    profile: ProfileModel;
}

class OrderItemModel {
    id: number;

    title: string;
}

class OrderModel {
    id: number;

    status: string;

    customerId: number;

    customer: CustomerModel;

    items: OrderItemModel[];

    payload: {
        source: string,
        metadata: {
            code: string,
        },
    };
}

describe('SearchQuery type helpers', () => {
    it('accepts model fields for select methods', () => {
        const searchQuery = new SearchQuery<OrderModel>();

        searchQuery
            .select(['id', 'status'])
            .addSelect('customerId')
            .excludeSelect('status');

        expect(searchQuery.getSelect()).toEqual(['id', 'status', 'customerId']);
        expect(searchQuery.getExcludeSelect()).toEqual(['status']);
    });

    it('accepts model paths for orderBy methods', () => {
        const searchQuery = new SearchQuery<OrderModel>();

        searchQuery
            .orderBy('customer.profile.city', 'desc')
            .addOrderBy({
                status: 'asc',
                'items.title': 'desc',
                'customer.profile.country.region.name': 'asc',
            });

        expect(searchQuery.getOrderBy()).toEqual({
            '"model_customer_profile"."city"': 'desc',
            '"model"."status"': 'asc',
            '"model_items"."title"': 'desc',
            '"model_customer_profile_country_region"."name"': 'asc',
        });
    });

    it('accepts relation paths for with methods', () => {
        const searchQuery = new SearchQuery<OrderModel>();

        searchQuery
            .with(['customer', 'customer.profile', 'customer.profile.country.region', 'customerId'])
            .with({
                items: ['id', 'title'],
            })
            .withNoJoin(['items']);

        expect(searchQuery.getWith()).toEqual([
            'customer',
            'customer.profile',
            'customer.profile.country',
            'customer.profile.country.region',
            'customerId',
            'items',
        ]);
        expect(searchQuery.getWithNoJoin()).toEqual({
            items: {
                alias: null,
                select: '*',
            },
        });
    });

    it('does not include JSON objects in with relation path suggestions', () => {
        const customerRelation: ISearchQueryWithRelationPath<OrderModel> = 'customer';
        const nestedCustomerRelation: ISearchQueryWithRelationPath<OrderModel> = 'customer.profile';
        const deepCustomerRelation: ISearchQueryWithRelationPath<OrderModel> = 'customer.profile.country.region';

        // @ts-expect-error JSON object fields should not be suggested as relation paths.
        const payloadRelation: ISearchQueryWithRelationPath<OrderModel> = 'payload';
        // @ts-expect-error Nested JSON object fields should not be suggested as relation paths.
        const nestedPayloadRelation: ISearchQueryWithRelationPath<OrderModel> = 'payload.metadata';

        expect(customerRelation).toEqual('customer');
        expect(nestedCustomerRelation).toEqual('customer.profile');
        expect(deepCustomerRelation).toEqual('customer.profile.country.region');
        expect(payloadRelation).toEqual('payload');
        expect(nestedPayloadRelation).toEqual('payload.metadata');
    });

    it('accepts model paths for where methods', () => {
        const searchQuery = new SearchQuery<OrderModel>();

        searchQuery
            .where(['=', 'customer.profile.city', 'Krasnoyarsk'])
            .andWhere(['=', 'customer.profile.country.region.name', 'Siberia'])
            .andWhere({
                status: 'created',
                customer: {
                    profile: {
                        city: 'Krasnoyarsk',
                    },
                },
            })
            .orWhere(['some', 'items', ['like', 'items.title', 'book']])
            .filterWhere(['in', 'customerId', [1, 2]]);

        expect(searchQuery.getWhere()).toEqual([
            'filter',
            ['in', 'customerId', [1, 2]],
        ]);
    });
});
