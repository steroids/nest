import {DeepPartial, Repository} from '@steroidsjs/typeorm';
import * as Promise from 'bluebird';
import {SelectQueryBuilder} from '@steroidsjs/typeorm/query-builder/SelectQueryBuilder';
import {SearchInputDto} from '../../../usecases/dtos/SearchInputDto';
import {SearchResultDto} from '../../../usecases/dtos/SearchResultDto';
import SearchQuery from '../../../usecases/base/SearchQuery';
import {QueryAdapterTypeORM} from '../../adapters/QueryAdapterTypeORM';

export class SearchHelperTypeORM {

    static async search<TTable>(
        repository: Repository<DeepPartial<TTable>>,
        dto: SearchInputDto,
        searchQuery: SearchQuery<TTable>,
        prepareHandler: (query: SelectQueryBuilder<TTable>) => void | null = null,
    ): Promise<SearchResultDto<TTable>> {
        const result = new SearchResultDto<TTable>();

        // Defaults
        dto = {
            page: 1,
            pageSize: 50,
            ...dto,
        };

        // Create query
        const dbQuery = repository.createQueryBuilder(searchQuery.getAlias());
        const modelAlias = dbQuery.alias;

        QueryAdapterTypeORM.prepare(repository, dbQuery, searchQuery);

        // Sort
        const sort = typeof dto.sort === 'string' ? dto.sort.split(',') : (dto.sort || []);
        if (sort.length > 0) {
            dbQuery.orderBy(sort.reduce((obj, value) => {
                const fieldNameToSort = `${modelAlias}.${value.replace('!', '')}`;
                obj[fieldNameToSort] = value.includes('!') ? 'DESC' : 'ASC';
                return obj;
            }, {}));
        }

        // Prepare
        if (prepareHandler) {
            prepareHandler.call(null, dbQuery);
        }

        // Pagination
        if (dto.pageSize > 0) {
            dbQuery
                .skip((dto.page - 1) * dto.pageSize)
                .take(dto.pageSize);
        }

        // Execute query
        const [items, total] = await Promise.resolve(dbQuery.getManyAndCount());
        result.items = items;
        result.total = total;

        return result;
    }
}
