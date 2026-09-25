import {AutocompleteBaseDto} from './dtos/AutocompleteBaseDto';
import {AutocompleteBaseItemSchema, AutocompleteBaseSchema} from './dtos/AutocompleteBaseSchema';
import SearchQuery from '../../base/SearchQuery';
import {DataMapper} from '../../helpers/DataMapper';
import {ValidationHelper} from '../../helpers/ValidationHelper';
import {ContextDto} from '../../dtos/ContextDto';
import {ReadService} from '../../services/ReadService';
import {ICrudRepository} from '../../interfaces/ICrudRepository';
import {SearchResultDto} from '../../dtos/SearchResultDto';

type AutocompleteItemSchemaClass = new (...args: any[]) => AutocompleteBaseItemSchema;

export abstract class AutoCompleteSearchUseCase<TModel> {
    protected constructor(
       protected readonly entityService: ReadService<TModel>,
       protected readonly repository: ICrudRepository<TModel>,
    ) {}

    public async handle<TSchema extends AutocompleteItemSchemaClass>(
        dto: AutocompleteBaseDto,
        context: ContextDto | null,
        schemaClass: TSchema,
    ): Promise<AutocompleteBaseSchema<InstanceType<TSchema>>> {
        await ValidationHelper.validate(dto, {context});

        const primaryKey = this.entityService.getPrimaryKey();

        const [selectedItems, searchResult] = await Promise.all([
            this.getSelectedItems(schemaClass, primaryKey, dto.withIds),
            this.getSearchResult(dto, context, schemaClass, primaryKey),
        ]);

        return {
            selectedItems,
            items: searchResult.items as InstanceType<TSchema>[],
            total: searchResult.total,
        };
    }

    protected fillQueryFromSearchDto(
        searchQuery: SearchQuery<TModel>,
        dto: AutocompleteBaseDto,
        context: ContextDto | null = null,
    ): SearchQuery<TModel> {
        return searchQuery;
    }

    private async getSearchResult<TSchema extends AutocompleteItemSchemaClass>(
        dto: AutocompleteBaseDto,
        context: ContextDto | null,
        schemaClass: TSchema,
        primaryKey: string,
    ): Promise<SearchResultDto<InstanceType<TSchema>>> {
        const searchQuery = SearchQuery.createFromSchema<TModel>(schemaClass);

        this.fillQueryFromSearchDto(searchQuery, dto, context);

        if (dto.withIds?.length) {
            searchQuery.andWhere(['not in', primaryKey, dto.withIds]);
        }

        const searchResult = await this.repository.search(dto, searchQuery);
        searchResult.items = DataMapper.create(schemaClass, searchResult.items) as InstanceType<TSchema>[];

        return searchResult as SearchResultDto<InstanceType<TSchema>>;
    }

    private async getSelectedItems<TSchema extends AutocompleteItemSchemaClass>(
        schemaClass: TSchema,
        primaryKey: string,
        selectedIds?: number[],
    ): Promise<InstanceType<TSchema>[]> {
        if (!selectedIds?.length) {
            return [];
        }

        const searchQuery = SearchQuery.createFromSchema<TModel>(schemaClass);

        searchQuery.where(['in', primaryKey, selectedIds]);

        const selectedModels = await this.entityService.findMany(searchQuery);

        // TODO разобраться с типизацией, чтобы убрать явное приведение
        return DataMapper.create(schemaClass, selectedModels) as InstanceType<TSchema>[];
    }
}
