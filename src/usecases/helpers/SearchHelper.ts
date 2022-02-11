import {Repository} from 'typeorm';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';
import {SearchInputDto} from '../dtos/SearchInputDto';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {MetaHelper} from '../../infrastructure/helpers/MetaHelper';
import {columns} from '../../../../react/src/ui/list/Grid/demo/basic';

export class SearchHelper {
    static async search<TTable>(
        repository: Repository<any>,
        dto: SearchInputDto,
        prepareHandler: (query: SelectQueryBuilder<TTable>) => void | null = null,
        schemaClass: any = null,
    ): Promise<SearchResultDto<TTable>> {
        const result = new SearchResultDto<TTable>();

        // Defaults
        dto = {
            page: 1,
            pageSize: 50,
            ...dto,
        };

        // Create query
        const query = repository.createQueryBuilder();

        // Get select and relations from search schema
        const schemaOptions = MetaHelper.getSchemaOptions(schemaClass);
        if (schemaOptions) {
            if (schemaOptions.excludeSelect) {
                schemaOptions.select = repository.metadata.columns
                    .map(column => column.propertyName)
                    .filter(name => !schemaOptions.excludeSelect.includes(name));
            }
            if (schemaOptions.select) {
                // TODO nested selects
                query.addSelect(schemaOptions.select);
            }


        }

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
