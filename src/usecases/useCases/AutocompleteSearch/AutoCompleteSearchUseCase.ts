import {AutocompleteBaseDto} from './dtos/AutocompleteBaseDto';
import {AutocompleteBaseItemSchema, AutocompleteBaseSchema} from './dtos/AutocompleteBaseSchema';
import SearchQuery from '../../base/SearchQuery';
import {DataMapper} from '../../helpers/DataMapper';
import {ValidationHelper} from '../../helpers/ValidationHelper';
import {ContextDto} from '../../dtos/ContextDto';
import {ReadService} from '../../services/ReadService';

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
            this.entityService.search(dto, context, schemaClass),
        ]);

        const selectedIds = new Set(dto.withIds ?? []);
        const items = (searchResult.items as InstanceType<TSchema>[])
            .filter(item => !selectedIds.has(item[primaryKey]));

        return {
            selectedItems,
            items,
            total: searchResult.total,
        };
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
