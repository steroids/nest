import {Type} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {ICrudRepository} from '../interfaces/ICrudRepository';
import {DataMapperHelper} from '../helpers/DataMapperHelper';
import {ISearchInputDto} from '../dtos/SearchInputDto';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {validateOrReject} from '../helpers/ValidationHelper';
import SearchQuery from '../base/SearchQuery';

/**
 * Generic CRUD service
 */
export class CrudService<TModel,
    TSearchDto = ISearchInputDto,
    TSaveDto = TModel> {
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

    init(repository: ICrudRepository<TModel>, ModelClass) {
        this.repository = repository;
        this.modelClass = ModelClass;
    }

    async search(dto: TSearchDto): Promise<SearchResultDto<TModel>>
    async search<TSchema>(
        dto: TSearchDto,
        schemaClass: Type<TSchema>
    ): Promise<SearchResultDto<Type<TSchema>>>

    /**
     * Search models with pagination, order and filters
     * @param dto
     * @param schemaClass
     */
    async search<TSchema>(
        dto: TSearchDto,
        schemaClass: Type<TSchema> = null
    ): Promise<SearchResultDto<TModel | Type<TSchema>>> {
        await validateOrReject(dto);

        const result = await this.repository.search<TSchema>(dto, SearchQuery.createFromSchema(schemaClass));
        if (schemaClass) {
            result.items = result.items.map((model: TModel) => this.modelToSchema<TSchema>(model, schemaClass));
        }
        return result;
    }

    async findById(id: number | string): Promise<TModel>
    async findById<TSchema>(
        id: number | string,
        schemaClass: Type<TSchema>,
    ): Promise<Type<TSchema>>

    /**
     * Find model by id
     * @param id
     * @param schemaClass
     */
    async findById<TSchema>(
        id: number | string,
        schemaClass: Type<TSchema> = null,
    ): Promise<TModel | Type<TSchema>> {
        const searchQuery = SearchQuery.createFromSchema(schemaClass);
        searchQuery.condition = {[this.primaryKey]: _toInteger(id)};
        const model = await this.findOne(searchQuery);
        return schemaClass ? this.modelToSchema<TSchema>(model, schemaClass) : model;
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

    async create(dto: TSaveDto): Promise<TModel>
    async create<TSchema>(
        dto: TSaveDto,
        schemaClass: Type<TSchema>,
    ): Promise<Type<TSchema>>

    /**
     * Create new model
     * @param dto
     * @param schemaClass
     */
    async create<TSchema>(
        dto: TSaveDto,
        schemaClass: Type<TSchema> = null,
    ): Promise<TModel | Type<TSchema>> {
        await validateOrReject(dto);

        const model = await this.repository.create(await this.dtoToModel(dto));
        return schemaClass ? this.findById(model[this.primaryKey], schemaClass) : model;
    }

    async update<TSchema>(id: number | string, dto: TSaveDto): Promise<TModel>
    async update<TSchema>(
        id: number | string,
        dto: TSaveDto,
        schemaClass: Type<TSchema>,
    ): Promise<Type<TSchema>>

    /**
     * Update model
     * @param id
     * @param dto
     * @param schemaClass
     */
    async update<TSchema>(
        id: number | string,
        dto: TSaveDto,
        schemaClass: Type<TSchema> = null,
    ): Promise<TModel | Type<TSchema>> {
        await validateOrReject(dto);

        const model = await this.repository.update(_toInteger(id), await this.dtoToModel(dto));
        return schemaClass ? this.findById(id, schemaClass) : model;
    }

    /**
     * Remove model
     * @param id
     */
    async remove(id: number | string): Promise<void> {
        await this.repository.remove(_toInteger(id));
    }

    /**
     * Mapping model to schema class
     * @param model
     * @param schemaClass
     * @protected
     */
    protected modelToSchema<TSchema>(model: TModel, schemaClass: Type<TSchema>): Type<TSchema> {
        return DataMapperHelper.anyToSchema(model, schemaClass);
    }

    /**
     * Mapping dto to model class
     * @param dto
     * @protected
     */
    protected dtoToModel(dto: TSaveDto): Promise<TModel> {
        if (!this.modelClass) {
            throw new Error('Property modelClass is not set in service: ' + this.constructor.name);
        }

        return DataMapperHelper.anyToModel(dto, this.modelClass);
    }
}
