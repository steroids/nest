import {Repository} from 'typeorm';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';
import {SearchInputDto} from '../../usecases/dtos/SearchInputDto';
import {SearchResultDto} from '../../usecases/dtos/SearchResultDto';

export class SearchHelper {
    static async search<T>(
        repository: Repository<T>,
        dto: SearchInputDto,
        prepareHandler: (query: SelectQueryBuilder<T>) => void | null = null,
    ): Promise<SearchResultDto<T>> {
        const result = new SearchResultDto<T>();

        // Defaults
        dto = {
            page: 1,
            pageSize: 50,
            ...dto,
        };

        // Create query
        const query = repository.createQueryBuilder();

        // Sort
        const sort = typeof dto.sort === 'string' ? dto.sort.split(',') : (dto.sort || []);
        if (sort.length === 0) {
            query.orderBy(sort.reduce((obj, value) => {
                obj[value.replace('!', '')] = value.indexOf('!') === 0 ? 'DESC' : 'ASC';
                return obj;
            }, {}));
        }

        // Prepare
        if (prepareHandler) {
            prepareHandler.call(null, query);
        }

        // Pagination
        query
            .offset((dto.page - 1) * dto.pageSize)
            .limit(dto.pageSize);

        // Execute query
        const [items, total] = await query.getManyAndCount();
        result.items = items;
        result.total = total;

        return result;
    }
}
