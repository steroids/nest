import {toInteger as _toInteger} from 'lodash';
import {ICrudRepository} from '../interfaces/ICrudRepository';
import {DataMapperHelper} from '../helpers/DataMapperHelper';
import {ISearchInputDto} from '../dtos/SearchInputDto';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {validateOrReject} from "../helpers/ValidationHelper";
import {plainToInstance} from "class-transformer";

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

    createModel(): TModel | any {
        const ModelClass = this.modelClass;
        return new ModelClass();
    }

    /**
     * Search models with pagination, order and filters
     * @param dto
     */
    async search(dto: TSearchDto): Promise<SearchResultDto<TModel>> {
        await validateOrReject(dto);
        const repositoryResult = await this.repository.search(dto);
        return repositoryResult;
    }

    /**
     * Find model by id
     * @param id
     */
    async findById(id: number | string): Promise<TModel> {
        const model = await this.repository.findOne({[this.primaryKey]: _toInteger(id)});
        return model;
    }

    /**
     * Create new model
     * @param dto
     */
    async create(dto: TSaveDto): Promise<TModel> {
        await validateOrReject(dto);
        let model = this.dtoToModel(dto);
        await validateOrReject(model);
        const tmodel = await this.repository.create(model);
        return tmodel;
    }

    /**
     * Update model
     * @param id
     * @param dto
     */
    async update(id: number | string, dto: TSaveDto): Promise<TModel> {
        await validateOrReject(dto);
        let model = this.dtoToModel(dto);
        await validateOrReject(model);
        model = await this.repository.update(_toInteger(id), model);
        return model;
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
     * @param model
     * @protected
     */
    protected dtoToModel(dto: TSaveDto): TModel {
        return plainToInstance(this.modelClass, dto);
    }
}
