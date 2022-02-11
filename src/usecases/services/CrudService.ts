import {toInteger as _toInteger} from 'lodash';
import {ICrudRepository} from '../interfaces/ICrudRepository';
import {DataMapperHelper} from '../helpers/DataMapperHelper';
import {ISearchInputDto} from '../dtos/SearchInputDto';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {validateOrReject} from '../helpers/ValidationHelper';

/**
 * Generic CRUD service
 */
export class CrudService<
    TModel,
    TSearchDto = ISearchInputDto,
    TSaveDto = TModel
    > {
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

    /**
     * Search models with pagination, order and filters
     * @param dto
     * @param schemaClass
     */
    async search(dto: TSearchDto, schemaClass = null): Promise<SearchResultDto<TModel>> {
        await validateOrReject(dto);
        return await this.repository.search(dto, schemaClass);
    }

    /**
     * Find model by id
     * @param id
     */
    async findById(id: number | string): Promise<TModel> {
        return this.repository.findOne({[this.primaryKey]: _toInteger(id)});
    }

    /**
     * Create new model
     * @param dto
     */
    async create(dto: TSaveDto): Promise<TModel> {
        await validateOrReject(dto);
        return this.repository.create(await this.dtoToModel(dto));
    }

    /**
     * Update model
     * @param id
     * @param dto
     */
    async update(id: number | string, dto: TSaveDto): Promise<TModel> {
        await validateOrReject(dto);
        return this.repository.update(_toInteger(id), await this.dtoToModel(dto));
    }

    /**
     * Remove model
     * @param id
     */
    async remove(id: number | string): Promise<void> {
        await this.repository.remove(_toInteger(id));
    }

    /**
     * Mapping dto to model class
     * @param dto
     * @protected
     */
    protected async dtoToModel(dto: TSaveDto): Promise<TModel> {
        if (!this.modelClass) {
            throw new Error('Property modelClass is not set in service: ' + this.constructor.name);
        }

        return DataMapperHelper.anyToModel(dto, this.modelClass);
    }
}
