import {Type} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {ICrudRepository} from '../interfaces/ICrudRepository';
import {DataMapper} from '../helpers/DataMapper';
import {ISearchInputDto} from '../dtos/SearchInputDto';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {ValidationHelper} from '../helpers/ValidationHelper';
import SearchQuery from '../base/SearchQuery';
import {ContextDto} from '../dtos/ContextDto';
import {getMetaRelations} from '../../infrastructure/decorators/fields/BaseField';
import {IValidator, IValidatorParams} from '../interfaces/IValidator';

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
        const nextModel = await this.dtoToModel(dto);

        await this.validate(dto, {
            nextModel,
            context,
        });

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

        // Fetch previous model state
        let prevModel = await this.findOne(
            (new SearchQuery())
                .where({[this.primaryKey]: id})
                .with(getMetaRelations(dto.constructor))
        );
        if (!prevModel) {
            throw new Error('Not found model by id: ' + id);
        }

        // Create next model state
        const ModelClass = this.modelClass;
        const nextModel = new ModelClass();

        // Сперва добавляем данные для новой модели из старой
        DataMapper.applyValues(nextModel, prevModel);

        // Затем накатываем изменения
        DataMapper.applyValues(nextModel, this.dtoToModel(dto));

        // Принудительно добавляем primary key, т.к. его зачастую нет в dto
        nextModel[this.primaryKey] = id;

        // Validate dto
        await this.validate(dto, {
            prevModel,
            nextModel,
            context,
        });

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
        return DataMapper.create(schemaClass, model);
    }

    /**
     * Mapping dto to model class
     * @param dto
     * @protected
     */
    protected dtoToModel(dto: TSaveDto): TModel {
        if (!this.modelClass) {
            throw new Error('Property modelClass is not set in service: ' + this.constructor.name);
        }
        return DataMapper.create(this.modelClass, dto);
    }

    protected async validate(dto: any, params?: IValidatorParams) {
        await ValidationHelper.validate(dto, params, this.validators);
    }
}
