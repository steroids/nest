import {Repository} from 'typeorm';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';
import {cloneDeep as _cloneDeep} from 'lodash';
import {SearchInputDto} from '../dtos/SearchInputDto';
import {SearchResultDto} from '../dtos/SearchResultDto';
import SearchQuery from '../base/SearchQuery';

export class SearchHelper {

    static async search<TTable>(
        repository: Repository<any>,
        dto: SearchInputDto,
        searchQuery: SearchQuery,
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

        SearchQuery.prepare(repository, dbQuery, searchQuery);

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

        const [allItems, total] = await dbQuery.getManyAndCount();

        // Pagination
        let itemsIds = allItems.map(item => item.id);
        if (dto.pageSize > 0) {
            const begin = (dto.page - 1) * dto.pageSize;
            itemsIds = itemsIds.slice(begin, begin + dto.pageSize);
        }
        dbQuery.andWhere(`"${searchQuery.getAlias()}".id IN (:...itemsIds)`, {itemsIds});

        // Execute query
        const items = await dbQuery.getMany();
        result.items = items;
        result.total = total;

        return result;
    }
}
