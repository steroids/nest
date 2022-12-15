import {EntityManager, Repository} from 'typeorm';
import {SearchHelperTypeORM} from '../helpers/typeORM/SearchHelperTypeORM';
import {ICrudRepository} from '../../usecases/interfaces/ICrudRepository';
import {SearchInputDto} from '../../usecases/dtos/SearchInputDto';
import {SearchResultDto} from '../../usecases/dtos/SearchResultDto';
import SearchQuery from '../../usecases/base/SearchQuery';
import {DataMapper} from '../../usecases/helpers/DataMapper';
import {SelectQueryBuilder} from 'typeorm/query-builder/SelectQueryBuilder';
import {ICondition} from '../helpers/typeORM/ConditionHelperTypeORM';
import {ISaveManager} from '../../usecases/interfaces/ISaveManager';
import {getTableFromModel, setModelBuilder} from '../decorators/TableFromModel';
import {TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../decorators/Transform';
import {OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import {QueryAdapterTypeORM} from '../adapters/QueryAdapterTypeORM';

/**
 * Generic CRUD repository
 */
export class CrudRepository<TModel> implements ICrudRepository<TModel>, OnModuleInit, OnModuleDestroy {
    /**
     * Table primary key
     */
    public primaryKey: string = 'id';

    /**
     * TypeORM repository instance
     */
    public dbRepository: Repository<unknown>;

    protected modelClass;

    onModuleInit() {
        if (this.modelClass) {
            setModelBuilder(this.modelClass, this.entityToModel.bind(this));
        }
    }

    onModuleDestroy() {
        if (this.modelClass) {
            setModelBuilder(this.modelClass, null);
        }
    }

    /**
     * Manually initialize database repository (without extend class CrudRepository)
     * @param dbRepository
     * @param modelClass
     */
    public init(dbRepository: Repository<unknown>, modelClass: any) {
        this.dbRepository = dbRepository;
        this.modelClass = modelClass;
    }

    /**
     * Search items with pagination, filters and sorting
     * @param dto
     * @param searchQuery
     */
    async search(dto: SearchInputDto, searchQuery: SearchQuery<TModel>): Promise<SearchResultDto<TModel>> {
        const result = await SearchHelperTypeORM.search<TModel>(
            this.dbRepository as any,
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
     * @param eagerLoading
     */
    async findOne(conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading = true): Promise<TModel | null> {
        const dbQuery = this.createQueryBuilder(conditionOrQuery, eagerLoading);
        const row = await dbQuery.getOne();
        return row ? this.entityToModel(row) : null;
    }

    /**
     * Find item by condition
     * @param conditionOrQuery
     * @param eagerLoading
     */
    async findMany(conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading = true): Promise<TModel[]> {
        const dbQuery = this.createQueryBuilder(conditionOrQuery, eagerLoading);

        const rows = await dbQuery.getMany();
        return rows.map(row => this.entityToModel(row));
    }

    /**
     * Create db query builder for findOne() and findMany() methods
     * @param conditionOrQuery
     * @param eagerLoading
     * @protected
     */
    protected createQueryBuilder(conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading: boolean = true): SelectQueryBuilder<any> {
        let searchQuery = conditionOrQuery as SearchQuery<TModel>;
        if (!(conditionOrQuery instanceof SearchQuery)) {
            searchQuery = new SearchQuery<TModel>();
            searchQuery.where(conditionOrQuery);
        }

        const dbQuery = this.dbRepository.createQueryBuilder(searchQuery.getAlias());
        QueryAdapterTypeORM.prepare(this.dbRepository, dbQuery, searchQuery, eagerLoading);

        return dbQuery;
    }

    /**
     * Create item
     * @param model
     * @param transactionHandler
     * @deprecated Use save() method
     */
    async create(model: TModel, transactionHandler?: (callback) => Promise<void>): Promise<TModel> {
        model[this.primaryKey] = undefined;
        return this.save(model, transactionHandler);
    }

    /**
     * Update item
     * @param id
     * @param model
     * @param transactionHandler
     * @deprecated Use save() method
     */
    async update(id: number, model: TModel, transactionHandler?: (callback) => Promise<void>): Promise<TModel> {
        model[this.primaryKey] = id;
        return this.save(model, transactionHandler);
    }

    /**
     * Create or update item
     * @param model
     * @param transactionHandler
     */
    async save(model: TModel, transactionHandler?: (callback) => Promise<void>): Promise<TModel> {
        const saver = async (manager: EntityManager, nextModel: TModel) => {
            const entity = this.modelToEntity(nextModel);
            const newEntity = await manager.save(entity);
            DataMapper.applyValues(nextModel, newEntity, TRANSFORM_TYPE_FROM_DB);
        };

        if (transactionHandler) {
            await this.dbRepository.manager.transaction(async (manager) => {
                await transactionHandler(async () => {
                    await this.saveInternal({save: (nextModel) => saver(manager, nextModel)}, model);
                });
            });
        } else {
            await this.saveInternal({save: (nextModel) => saver(this.dbRepository.manager, nextModel)}, model);
        }

        return model;
    }

    /**
     * Internal save method for overwrite in project
     * @param manager
     * @param nextModel
     */
    async saveInternal(manager: ISaveManager, nextModel: TModel) {
        await manager.save(nextModel);
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
                    await this.removeInternal(manager, id);
                });
            });
        } else {
            await this.removeInternal(this.dbRepository.manager, id);
        }
    }

    /**
     * Internal remove method for overwrite in project
     * @param manager
     * @param id
     */
    async removeInternal(manager: EntityManager, id: number) {
        await manager.remove(this.dbRepository.create({id}));
    }

    /**
     * Mapping model to entity object
     * @param model
     * @protected
     */
    protected modelToEntity(model): any {
        return DataMapper.create(getTableFromModel(this.modelClass), model, TRANSFORM_TYPE_TO_DB);
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

        return DataMapper.create(this.modelClass, obj, TRANSFORM_TYPE_FROM_DB, true);
    }
}
