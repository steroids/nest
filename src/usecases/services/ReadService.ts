import {Type} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {ICrudRepository} from '../interfaces/ICrudRepository';
import {DataMapper} from '../helpers/DataMapper';
import {ISearchInputDto} from '../dtos/SearchInputDto';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {ValidationHelper} from '../helpers/ValidationHelper';
import SearchQuery from '../base/SearchQuery';
import {ContextDto} from '../dtos/ContextDto';
import {IValidator, IValidatorParams} from '../interfaces/IValidator';

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
    protected modelClass;

    /**
     * Injected validator instances
     */
    public validators: IValidator[];

    init(repository: ICrudRepository<TModel>, ModelClass) {
        this.repository = repository;
        this.modelClass = ModelClass;
    }

    async search(dto: TSearchDto, context?: ContextDto | null): Promise<SearchResultDto<TModel>>
    async search<TSchema>(
        dto: TSearchDto,
        context?: ContextDto | null,
        schemaClass?: Type<TSchema>
    ): Promise<SearchResultDto<Type<TSchema>>>

    /**
     * Search models with pagination, order and filters
     * @param dto
     * @param context
     * @param schemaClass
     */
    async search<TSchema>(
        dto: TSearchDto,
        context: ContextDto = null,
        schemaClass: Type<TSchema> = null
    ): Promise<SearchResultDto<TModel | Type<TSchema>>> {
        await this.validate(dto, {
            context,
        });

        const result = await this.repository.search<TSchema>(
            dto,
            schemaClass ? SearchQuery.createFromSchema(schemaClass) : new SearchQuery(),
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
        schemaClass?: Type<TSchema>,
    ): Promise<Type<TSchema>>

    /**
     * Find model by id
     * @param id
     * @param context
     * @param schemaClass
     */
    async findById<TSchema>(
        id: number | string,
        context: ContextDto = null,
        schemaClass: Type<TSchema> = null,
    ): Promise<TModel | Type<TSchema>> {
        const searchQuery = schemaClass ? SearchQuery.createFromSchema(schemaClass) : new SearchQuery();
        searchQuery.andWhere({[this.primaryKey]: _toInteger(id)});
        const model = await this.findOne(searchQuery);
        return schemaClass ? this.modelToSchema<TSchema>(model, schemaClass) : model;
    }

    createQuery(): SearchQuery {
        return this.repository.createQuery();
    }

    /**
     * Find one model by search query (selects and condition)
     * @param searchQuery
     */
    async findOne(searchQuery: SearchQuery): Promise<TModel> {
        return await this.repository.findOne(searchQuery);
    }

    /**
     * Find many models by search query (selects and condition)
     * @param searchQuery
     */
    async findMany(searchQuery: SearchQuery): Promise<TModel[]> {
        return await this.repository.findMany(searchQuery);
    }

    /**
     * Mapping model to schema class
     * @param model
     * @param schemaClass
     * @protected
     */
    protected modelToSchema<TSchema>(model: TModel, schemaClass: Type<TSchema>): Type<TSchema> {
        return DataMapper.create(schemaClass, model);
    }

    protected async validate(dto: any, params?: IValidatorParams) {
        await ValidationHelper.validate(dto, params, this.validators);
    }
}
