import {AutocompleteBaseDto} from './dtos/AutocompleteBaseDto';
import {AutocompleteBaseItemSchema, AutocompleteBaseSchema} from './dtos/AutocompleteBaseSchema';
import SearchQuery from '../../base/SearchQuery';
import {DataMapper} from '../../helpers/DataMapper';
import {ValidationHelper} from '../../helpers/ValidationHelper';
import {ContextDto} from '../../dtos/ContextDto';
import {ReadService} from '../../services/ReadService';
import {SearchResultDto} from '../../dtos/SearchResultDto';

type AutocompleteItemSchemaClass = new (...args: any[]) => AutocompleteBaseItemSchema;

export abstract class AutoCompleteSearchUseCase<TModel> {
    protected constructor(
       protected readonly entityService: ReadService<TModel>,
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
            this.getSearchResult(dto, schemaClass, primaryKey),
        ]);

        return {
            selectedItems,
            items: searchResult.items as InstanceType<TSchema>[],
            total: searchResult.total,
        };
    }

    private async getSearchResult<TSchema extends AutocompleteItemSchemaClass>(
        dto: AutocompleteBaseDto,
        schemaClass: TSchema,
        primaryKey: string,
    ): Promise<SearchResultDto<InstanceType<TSchema>>> {
        const searchQuery = SearchQuery.createFromSchema<TModel>(schemaClass);

        if (dto.withIds?.length) {
            searchQuery.andWhere(['not in', primaryKey, dto.withIds]);
        }

        return await this.entityService.searchByQuery(
            dto,
            searchQuery,
            schemaClass,
        ) as SearchResultDto<InstanceType<TSchema>>;
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
