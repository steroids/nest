import {Repository} from 'typeorm';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {SearchInputDto} from '../dtos/SearchInputDto';
import {ICondition} from '../../infrastructure/helpers/ConditionHelper';
import SteroidsQuery from '../base/SteroidsQuery';

export interface ICrudRepository<TModel> {
    dbRepository: Repository<any>;
    search: (query: SteroidsQuery<SearchInputDto>) => Promise<SearchResultDto<TModel>>,
    findOne: (condition: ICondition) => Promise<TModel>,
    create: (model: TModel) => Promise<TModel>,
    update: (id: number, model: TModel) => Promise<TModel>,
    remove: (id: number) => Promise<void>,
}
