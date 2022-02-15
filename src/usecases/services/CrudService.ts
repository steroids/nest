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

        const result = await this.repository.search<TSchema>(dto, SearchQuery.createFromSchema(schemaClass));
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

        let model;
        await this.repository.create(nextModel, async (save) => {
            await this.beforeSave(null, nextModel);
            model = await save();
            await this.afterSave(null, model);
        });

        return schemaClass ? this.findById(model[this.primaryKey], context, schemaClass) : model;
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
     * @param id
     * @param dto
     * @param context
     * @param schemaClass
     */
    async update<TSchema>(
        id: number | string,
        dto: TSaveDto,
        context: ContextDto = null,
        schemaClass: Type<TSchema> = null,
    ): Promise<TModel | Type<TSchema>> {
        await validateOrReject(dto);

        const prevModel = await this.findById(id);
        const nextModel = await this.dtoToModel(dto);

        let model;
        await this.repository.update(_toInteger(id), nextModel, async (save) => {
            await this.beforeSave(prevModel, nextModel);
            model = await save();
            await this.afterSave(prevModel, model);
        });

        return schemaClass ? this.findById(id, context, schemaClass) : model;
    }

    /**
     * Remove model
     * @param rawId
     * @param context
     */
    async remove(rawId: number | string, context: ContextDto = null): Promise<void> {
        const id: number = _toInteger(rawId);

        await this.repository.remove(id, async (remove) => {
            await this.beforeDelete(id);
            await remove();
            await this.afterDelete(id);
        });
    }

    /**
     * Handler for customize logic before save
     * @param prevModel
     * @param nextModel
     * @protected
     */
    protected async beforeSave(prevModel: TModel | null, nextModel: TModel) {
        // You handler code
    }

    /**
     * Handler for customize logic after save
     * @param prevModel
     * @param nextModel
     * @protected
     */
    protected async afterSave(prevModel: TModel | null, nextModel: TModel) {
        // You handler code
    }

    /**
     * Handler for customize logic before delete
     * @param id
     * @protected
     */
    protected async beforeDelete(id: number) {
        // You handler code
    }

    /**
     * Handler for customize logic after delete
     * @param id
     * @protected
     */
    protected async afterDelete(id: number) {
        // You handler code
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
