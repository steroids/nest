import {Type} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {ICrudRepository} from '../interfaces/ICrudRepository';
import {DataMapperHelper} from '../helpers/DataMapperHelper';
import {ISearchInputDto} from '../dtos/SearchInputDto';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {validateOrReject} from '../helpers/ValidationHelper';
import SearchQuery from '../base/SearchQuery';
import {ContextDto} from '../dtos/ContextDto';

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
        await validateOrReject(dto);

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

    async create(dto: TSaveDto, context?: ContextDto | null): Promise<TModel>
    async create<TSchema>(
        dto: TSaveDto,
        context?: ContextDto | null,
        schemaClass?: Type<TSchema>,
    ): Promise<Type<TSchema>>

    /**
     * Create new model
     * @param dto
     * @param context
     * @param schemaClass
     */
    async create<TSchema>(
        dto: TSaveDto,
        context: ContextDto = null,
        schemaClass: Type<TSchema> = null,
    ): Promise<TModel | Type<TSchema>> {
        await validateOrReject(dto);

        const nextModel = await this.dtoToModel(dto);

        await this.saveInternal(null, nextModel, context);
        return schemaClass ? this.findById(nextModel[this.primaryKey], context, schemaClass) : nextModel;
    }

    async update<TSchema>(id: number | string, dto: TSaveDto, context?: ContextDto | null): Promise<TModel>
    async update<TSchema>(
        id: number | string,
        dto: TSaveDto,
        context?: ContextDto | null,
        schemaClass?: Type<TSchema>,
    ): Promise<Type<TSchema>>

    /**
     * Update model
     * @param rawId
     * @param dto
     * @param context
     * @param schemaClass
     */
    async update<TSchema>(
        rawId: number | string,
        dto: TSaveDto,
        context: ContextDto = null,
        schemaClass: Type<TSchema> = null,
    ): Promise<TModel | Type<TSchema>> {
        const id: number = _toInteger(rawId);

        // Validate dto
        await validateOrReject(dto);

        // Fetch previous model state
        const prevModel = await this.findById(id);
        if (!prevModel) {
            throw new Error('Not found model by id: ' + id);
        }

        // Create next model state
        const ModelClass = this.modelClass;
        const nextModel = new ModelClass();
        DataMapperHelper.applyChangesToModel(nextModel, this.dtoToModel(dto));

        // Save
        await this.saveInternal(prevModel, nextModel, context);

        // Convert to schema, if need
        return schemaClass ? this.findById(id, context, schemaClass) : nextModel;
    }

    /**
     * Internal save method for overwrite in project
     * @param prevModel
     * @param nextModel
     * @param context
     */
    async saveInternal(prevModel: TModel | null, nextModel: TModel, context?: ContextDto) {
        // you code outside transaction before save
        await this.repository.save(nextModel, async (save) => {
            // you code inside transaction before save
            await save();
            // you code inside transaction after save
        });
        // you code outside transaction after save

        // or save() call without transaction
        // await this.repository.save(nextModel);
    }

    /**
     * Remove model
     * @param rawId
     * @param context
     */
    async remove(rawId: number | string, context: ContextDto = null): Promise<void> {
        const id: number = _toInteger(rawId);

        await this.removeInternal(id, context);
    }

    /**
     * Internal remove method for overwrite in project
     * @param id
     * @param context
     */
    async removeInternal(id: number, context?: ContextDto) {
        // you code outside transaction before remove
        await this.repository.remove(id, async (remove) => {
            // you code inside transaction before remove
            await remove();
            // you code inside transaction after remove
        });
        // you code outside transaction after remove

        // or remove() call without transaction
        // await this.repository.remove(id);
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
