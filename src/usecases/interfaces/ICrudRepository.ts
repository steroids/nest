import {Repository} from '@steroidsjs/typeorm';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {SearchInputDto} from '../dtos/SearchInputDto';
import SearchQuery, {ISearchQueryConfig} from '../base/SearchQuery';
import {ICondition} from '../../infrastructure/helpers/typeORM/ConditionHelperTypeORM';
import {IType} from './IType';

export interface ICrudRepository<TModel> {
    dbRepository: Repository<any>;
    search: <TItem>(dto: SearchInputDto, searchQuery: SearchQuery<TModel>) => Promise<SearchResultDto<TModel | IType<TItem>>>,
    findOne: (conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading?: boolean) => Promise<TModel | null>,
    findMany: (conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading?: boolean) => Promise<TModel[]>,
    create: (model: TModel, transactionHandler?: (callback) => Promise<void>) => Promise<TModel>,
    update: (id: number, model: TModel, transactionHandler?: (callback) => Promise<void>) => Promise<TModel>,
    save: (model: TModel, transactionHandler?: (callback) => Promise<void>) => Promise<TModel>,
    remove: (id: number, transactionHandler?: (callback) => Promise<void>) => Promise<void>,
    createQuery: (config?: ISearchQueryConfig<TModel>) => SearchQuery<TModel>,
}
