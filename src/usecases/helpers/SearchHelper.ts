import {Repository} from 'typeorm';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';
import {SearchInputDto} from '../dtos/SearchInputDto';
import {SearchResultDto} from '../dtos/SearchResultDto';
import SearchQuery from '../base/SearchQuery';

export class SearchHelper {

    static async search<TTable>(
        repository: Repository<any>,
        dto: SearchInputDto,
        query: SearchQuery,
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
        const dbQuery = repository.createQueryBuilder();

        SearchQuery.prepare(repository, dbQuery, query);

        // Sort
        const sort = typeof dto.sort === 'string' ? dto.sort.split(',') : (dto.sort || []);
        if (sort.length === 0) {
            dbQuery.orderBy(sort.reduce((obj, value) => {
                obj[value.replace('!', '')] = value.indexOf('!') === 0 ? 'DESC' : 'ASC';
                return obj;
            }, {}));
        }

        // Prepare
        if (prepareHandler) {
            prepareHandler.call(null, dbQuery);
        }

        // Pagination
        dbQuery
            .offset((dto.page - 1) * dto.pageSize)
            .limit(dto.pageSize);

        // Execute query
        const [items, total] = await dbQuery.getManyAndCount();
        result.items = items;
        result.total = total;

        return result;
    }
}
