import {Repository} from 'typeorm';
import {SearchHelper} from '../../usecases/helpers/SearchHelper';
import {ICrudRepository} from '../../usecases/interfaces/ICrudRepository';
import {SearchInputDto} from '../../usecases/dtos/SearchInputDto';
import {SearchResultDto} from '../../usecases/dtos/SearchResultDto';
import SearchQuery from '../../usecases/base/SearchQuery';
import {DataMapperHelper} from '../../usecases/helpers/DataMapperHelper';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';
import {ICondition} from '../../usecases/helpers/ConditionHelper';

/**
 * Generic CRUD repository
 */
export class CrudRepository<TModel> implements ICrudRepository<TModel> {
    /**
     * Table primary key
     */
    public primaryKey: string = 'id';

    /**
     * TypeORM repository instance
     */
    public dbRepository: Repository<any>;

    protected modelClass;

    /**
     * Manually initialize database repository (without extend class CrudRepository)
     * @param dbRepository
     * @param modelClass
     */
    public init(dbRepository: Repository<any>, modelClass: any) {
        this.dbRepository = dbRepository;
        this.modelClass = modelClass;
    }

    /**
     * Search items with pagination, filters and sorting
     * @param dto
     * @param searchQuery
     */
    async search(dto: SearchInputDto, searchQuery: SearchQuery): Promise<SearchResultDto<TModel>> {
        const result = await SearchHelper.search<TModel>(
            this.dbRepository,
            dto,
            searchQuery,
            null
        );
        result.items = result.items.map(item => this.entityToModel(item));
        return result;
    }

    /**
     * Find item by condition
     * @param conditionOrQuery
     */
    async findOne(conditionOrQuery: ICondition | SearchQuery): Promise<TModel | null> {
        const dbQuery = this.createQueryBuilder(conditionOrQuery);

        const row = await dbQuery.getOne();
        return row ? this.entityToModel(row) : null;
    }

    /**
     * Find item by condition
     * @param conditionOrQuery
     */
    async findMany(conditionOrQuery: ICondition | SearchQuery): Promise<TModel[]> {
        const dbQuery = this.createQueryBuilder(conditionOrQuery);

        const rows = await dbQuery.getMany();
        return rows.map(row => this.entityToModel(row));
    }

    /**
     * Create db query builder for findOne() and findMany() methods
     * @param conditionOrQuery
     * @protected
     */
    protected createQueryBuilder(conditionOrQuery: ICondition | SearchQuery): SelectQueryBuilder<any> {
        let searchQuery = conditionOrQuery as SearchQuery;
        if (!(conditionOrQuery instanceof SearchQuery)) {
            searchQuery = new SearchQuery();
            searchQuery.condition = conditionOrQuery;
        }

        const dbQuery = this.dbRepository.createQueryBuilder();
        SearchQuery.prepare(this.dbRepository, dbQuery, searchQuery);

        return dbQuery;
    }

    /**
     * Create item
     * @param model
     * @param transactionHandler
     */
    async create(model: TModel, transactionHandler?: (callback) => Promise<void>): Promise<TModel> {
        let entity;
        let nextModel;
        if (transactionHandler) {
            await this.dbRepository.manager.transaction(async (manager) => {
                await transactionHandler(async () => {
                    await this.beforeSave(null, model);
                    entity = await manager.save(this.modelToEntity(model));
                    nextModel = this.entityToModel(entity);
                    await this.afterSave(null, nextModel);

                    return nextModel;
                });
            });
        } else {
            entity = await this.dbRepository.manager.save(this.modelToEntity(model));
            nextModel = this.entityToModel(entity);
        }
        return nextModel;
    }

    /**
     * Update item
     * @param id
     * @param model
     * @param transactionHandler
     */
    async update(id: number, model: TModel, transactionHandler?: (callback) => Promise<void>): Promise<TModel> {
        const prevModel = await this.findOne({[this.primaryKey]: id});
        if (!prevModel) {
            throw new Error('Not found model by id: ' + id);
        }

        let entity;
        let nextModel;
        if (transactionHandler) {
            await this.dbRepository.manager.transaction(async (manager) => {
                await transactionHandler(async () => {
                    await this.beforeSave(prevModel, model);
                    entity = await manager.save(this.modelToEntity({...prevModel, ...model}));
                    nextModel = this.entityToModel(entity);
                    await this.afterSave(prevModel, nextModel);

                    return nextModel;
                });
            });
        } else {
            entity = await this.dbRepository.manager.save(this.modelToEntity({...prevModel, ...model}));
            nextModel = this.entityToModel(entity);
        }

        return nextModel;
    }

    /**
     * Remove item
     * @param id
     * @param transactionHandler
     */
    async remove(id: number, transactionHandler?: (callback) => Promise<void>): Promise<void> {
        if (transactionHandler) {
            await this.dbRepository.manager.transaction(async (manager) => {
                await transactionHandler(async () => {
                    await this.beforeDelete(id);
                    await manager.remove(id);
                    await this.afterDelete(id);
                });
            });
        } else {
            await this.dbRepository.manager.remove(id);
        }
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
     * Mapping model to entity object
     * @param model
     * @protected
     */
    protected modelToEntity(model): any {
        return DataMapperHelper.modelToEntity(this.dbRepository.manager.connection, model);
    }

    /**
     * Mapping entity object to model
     * @param obj
     * @protected
     */
    protected entityToModel(obj: any): TModel {
        if (!this.modelClass) {
            throw new Error('Property modelClass is not set in repository: ' + this.constructor.name);
        }
        return DataMapperHelper.anyToModel(obj, this.modelClass);
    }
}
