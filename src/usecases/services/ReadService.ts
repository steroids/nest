import {toInteger as _toInteger} from 'lodash';
import {ICrudRepository} from '../interfaces/ICrudRepository';
import {DataMapper} from '../helpers/DataMapper';
import {ISearchInputDto} from '../dtos/SearchInputDto';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {ValidationHelper} from '../helpers/ValidationHelper';
import SearchQuery, {ISearchQueryConfig} from '../base/SearchQuery';
import {ContextDto} from '../dtos/ContextDto';
import {IValidator, IValidatorParams} from '../interfaces/IValidator';
import {IType} from '../interfaces/IType';

/**
 * Generic Read service (search and find)
 */
export class ReadService<TModel, TSearchDto = ISearchInputDto> {
    /**
     * Model primary key
     */
    protected primaryKey: string = 'id';

    /**
     * CRUD repository instance (not TypeORM!)
     * @protected
     */
    protected repository: ICrudRepository<TModel>;

    /**
     * Model class
     * @protected
     */
    protected modelClass: any;

    /**
     * Injected validator instances
     */
    public validators: IValidator[];

    init(repository: ICrudRepository<TModel>, ModelClass: TModel) {
        this.repository = repository;
        this.modelClass = ModelClass;
    }

    async search(dto: TSearchDto, context?: ContextDto | null): Promise<SearchResultDto<TModel>>
    async search<TSchema>(
        dto: TSearchDto,
        context?: ContextDto | null,
        schemaClass?: IType<TSchema>,
    ): Promise<SearchResultDto<TSchema>>

    /**
     * Search models with pagination, order and filters
     * @param dto
     * @param context
     * @param schemaClass
     */
    async search<TSchema>(
        dto: TSearchDto,
        context: ContextDto = null,
        schemaClass: IType<TSchema> = null,
    ): Promise<SearchResultDto<TModel | TSchema>> {
        await this.validate(dto, {
            context,
        });

        const result = await this.repository.search<TSchema>(
            dto,
            schemaClass ? SearchQuery.createFromSchema<TModel>(schemaClass) : new SearchQuery(),
        );
        if (schemaClass) {
            result.items = result.items.map((model: TModel) => this.modelToSchema<TSchema>(model, schemaClass));
        }
        return result;
    }

    async findById(id: number | string, context?: ContextDto | null): Promise<TModel>
    async findById<TSchema>(
        id: number | string,
        context?: ContextDto | null,
        schemaClass?: IType<TSchema>,
    ): Promise<TSchema>

    /**
     * Find model by id
     * @param id
     * @param context
     * @param schemaClass
     */
    async findById<TSchema>(
        id: number | string,
        context: ContextDto = null,
        schemaClass: IType<TSchema> = null,
    ): Promise<TModel | TSchema> {
        const searchQuery = schemaClass ? SearchQuery.createFromSchema<TModel>(schemaClass) : new SearchQuery<TModel>();
        searchQuery.andWhere({[this.primaryKey]: _toInteger(id)});
        const model = await this.findOne(searchQuery);
        return schemaClass ? this.modelToSchema<TSchema>(model, schemaClass) : model;
    }

    /**
     * Find one model by search query (selects and condition)
     * @param searchQuery
     */
    async findOne(searchQuery: SearchQuery<TModel>): Promise<TModel> {
        return this.repository.findOne(searchQuery);
    }

    /**
     * Find many models by search query (selects and condition)
     * @param searchQuery
     */
    async findMany(searchQuery: SearchQuery<TModel>): Promise<TModel[]> {
        return await this.repository.findMany(searchQuery);
    }

    createQuery(config?: ISearchQueryConfig<TModel>): SearchQuery<TModel> {
        return new SearchQuery<TModel>({
            onGetMany: this.findMany.bind(this),
            onGetOne: this.findOne.bind(this),
            ...(config || {}),
        });
    }

    /**
     * Mapping model to schema class
     * @param model
     * @param schemaClass
     * @protected
     */
    protected modelToSchema<TSchema>(model: TModel, schemaClass: IType<TSchema>): TSchema {
        return DataMapper.create(schemaClass, model as any);
    }

    protected async validate(dto: any, params?: IValidatorParams) {
        await ValidationHelper.validate(dto, params, this.validators);
    }

    protected isModel(obj: unknown): obj is TModel {
        return obj instanceof this.modelClass;
    }
}
