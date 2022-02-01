import {Repository} from 'typeorm';
import {instanceToPlain} from 'class-transformer';
import {SearchHelper} from '../../usecases/helpers/SearchHelper';
import {ICrudRepository} from '../../usecases/interfaces/ICrudRepository';
import {SearchInputDto} from '../../usecases/dtos/SearchInputDto';
import {ConditionHelper, ICondition} from '../helpers/ConditionHelper';
import {SearchResultDto} from '../../usecases/dtos/SearchResultDto';

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
    public dbRepository: Repository<TModel>;

    protected modelClass;

    /**
     * Manually initialize database repository (without extend class CrudRepository)
     * @param dbRepository
     * @param modelClass
     */
    public init(dbRepository: Repository<TModel>, modelClass: any) {
        this.dbRepository = dbRepository;
        this.modelClass = modelClass;
    }

    /**
     * Search items with pagination, filters and sorting
     * @param dto
     */
    async search(dto: SearchInputDto): Promise<SearchResultDto<TModel>> {
        const result = await SearchHelper.search<TModel>(this.dbRepository, dto);
        result.items = result.items.map(item => this.entityToModel(item));
        return result;
    }

    /**
     * Find item by condition
     * @param condition
     */
    async findOne(condition: ICondition): Promise<TModel> {
        const entity = await this.dbRepository.findOne({
            where: ConditionHelper.toTypeOrm(condition),
        });
        return this.entityToModel(entity);
    }

    /**
     * Create item
     * @param model
     */
    async create(model: TModel): Promise<TModel> {
        const entity = await this.dbRepository.manager.save(this.modelToEntity(model));
        return this.entityToModel(entity);
    }

    /**
     * Update item
     * @param id
     * @param model
     */
    async update(id: number, model: TModel) {
        const prevModel = await this.findOne({[this.primaryKey]: id});
        const savedEntity = await this.dbRepository.save(this.modelToEntity({...prevModel, ...model}));
        return this.entityToModel(savedEntity);
    }

    /**
     * Remove item
     * @param id
     */
    async remove(id: number): Promise<void> {
        await this.dbRepository.delete(id);
    }

    /**
     * Mapping model to entity object
     * @param model
     * @protected
     */
    protected modelToEntity(model): any {
        // const EntityClass = this.dbRepository.target as any;
        //const entity = new EntityClass();
        //Object.assign(entity, instanceToPlain(model)); // TODO
        const entity = this.dbRepository.create(model);
        return entity;
    }

    /**
     * Mapping entity object to model
     * @param obj
     * @protected
     */
    protected entityToModel(obj: any): TModel {
        const ModelClass = this.modelClass as any;
        const model = new ModelClass();
        Object.assign(model, {...obj}); // TODO
        // return DataMapperHelper.anyToModel(obj, this.dbRepository.target);
        return model;
    }
}
