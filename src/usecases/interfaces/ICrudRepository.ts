import {Repository} from 'typeorm';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {SearchInputDto} from '../dtos/SearchInputDto';
import {ICondition} from '../../infrastructure/helpers/ConditionHelper';

export interface ICrudRepository<TModel> {
    dbRepository: Repository<any>;
    search: (dto: SearchInputDto) => Promise<SearchResultDto<TModel>>,
    findOne: (condition: ICondition) => Promise<TModel>,
    create: (model: TModel) => Promise<TModel>,
    update: (id: number, model: TModel) => Promise<TModel>,
    remove: (id: number) => Promise<void>,
}
