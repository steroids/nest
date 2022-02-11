import {Repository} from 'typeorm';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';
import {SearchInputDto} from '../dtos/SearchInputDto';
import {SearchResultDto} from '../dtos/SearchResultDto';
import SteroidsQuery from '../base/SteroidsQuery';

export class SearchHelper {
    static prepareSelect(
        repository: Repository<any>,
        dbQuery: SelectQueryBuilder<any>,
        query: SteroidsQuery<SearchInputDto>,
    ) {

        const prefix = dbQuery.expressionMap.mainAlias.name + '.';

        // Get select and relations from search schema
        let select = query.select;
        if (query.excludeSelect) {
            select = repository.metadata.columns
                .map(column => column.propertyName)
                .filter(name => !query.excludeSelect.includes(name));
        }

        if (select) {
            // TODO nested selects
            dbQuery.select(select.map(name => prefix + name));
        }

        // Find relations
        (query.relations || []).forEach(relation => {
            if (relation.isId) {
                dbQuery.loadRelationIdAndMap(
                    prefix + (relation.alias || relation.name),
                    prefix + relation.name,
                );
            } else {
                dbQuery.relation(relation.name);
            }
        });
    }

    static async search<TTable>(
        repository: Repository<any>,
        query: SteroidsQuery<SearchInputDto>,
        prepareHandler: (query: SelectQueryBuilder<TTable>) => void | null = null,
    ): Promise<SearchResultDto<TTable>> {
        const result = new SearchResultDto<TTable>();

        // Defaults
        const dto = {
            page: 1,
            pageSize: 50,
            ...query.dto,
        };

        // Create query
        const dbQuery = repository.createQueryBuilder();

        this.prepareSelect(repository, dbQuery, query);

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
