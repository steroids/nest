import {AutocompleteBaseDto} from './dtos/AutocompleteBaseDto';
import {AutocompleteBaseItemSchema, AutocompleteBaseSchema} from './dtos/AutocompleteBaseSchema';
import SearchQuery from '../../base/SearchQuery';
import {DataMapper} from '../../helpers/DataMapper';
import {ValidationHelper} from '../../helpers/ValidationHelper';
import {ContextDto} from '../../dtos/ContextDto';
import {ReadService} from '../../services/ReadService';

export abstract class AutoCompleteSearchUseCase<TModel> {
    protected constructor(
       protected readonly entityService: ReadService<TModel>,
   ) {}

    public async handle<TSchema extends new (...args: any[]) => AutocompleteBaseItemSchema>(
        dto: AutocompleteBaseDto,
        context: ContextDto | null,
        schemaClass: TSchema,
    ): Promise<AutocompleteBaseSchema<InstanceType<TSchema>>> {
        await ValidationHelper.validate(dto, {context});

        const [selectedItems, searchResult] = await Promise.all([
            this.getSelectedItems(schemaClass, dto.withIds),
            this.entityService.search(dto, context, schemaClass),
        ]);

        return {
            selectedItems,
            items: searchResult.items as InstanceType<TSchema>[],
            total: searchResult.total,
        };
    }

    private async getSelectedItems<TSchema extends new (...args: any[]) => AutocompleteBaseItemSchema>(
        schemaClass: TSchema,
        selectedIds?: number[],
    ): Promise<InstanceType<TSchema>[]> {
        if (!selectedIds?.length) {
            return [];
        }

        const primaryKey = this.entityService.getPrimaryKey();

        const searchQuery = SearchQuery.createFromSchema<TModel>(schemaClass);

        searchQuery.where(['in', primaryKey, selectedIds]);

        const selectedModels = await this.entityService.findMany(searchQuery);

        // TODO разобраться с типизацией, чтобы убрать явное приведение
        return DataMapper.create(schemaClass, selectedModels) as InstanceType<TSchema>[];
    }
}
