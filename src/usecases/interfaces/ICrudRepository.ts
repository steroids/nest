import {Repository} from 'typeorm';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {SearchInputDto} from '../dtos/SearchInputDto';
import {ICondition} from '../../infrastructure/helpers/ConditionHelper';

export interface ICrudRepository<Model> {
    dbRepository: Repository<Model>;
    search: (dto: SearchInputDto) => Promise<SearchResultDto<Model>>,
    findOne: (condition: ICondition) => Promise<Model>,
    create: (model: Model) => Promise<Model>,
    update: (id: number, model: Model) => Promise<Model>,
    remove: (id: number) => Promise<void>,
}
