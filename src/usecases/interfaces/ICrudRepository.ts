import {Repository} from '@steroidsjs/typeorm';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {SearchInputDto} from '../dtos/SearchInputDto';
import SearchQuery, {ISearchQueryConfig} from '../base/SearchQuery';
import {ICondition} from '../../infrastructure/helpers/typeORM/ConditionHelperTypeORM';
import {IType} from './IType';

export interface ICrudRepository<TModel> {
    dbRepository: Repository<any>;
    create: (model: TModel, transactionHandler?: (callback) => Promise<void>) => Promise<TModel>,
    createQuery: (config?: ISearchQueryConfig<TModel>) => SearchQuery<TModel>,
    findMany: (conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading?: boolean) => Promise<TModel[]>,
    findOne: (conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading?: boolean) => Promise<TModel | null>,
    remove: (id: number, transactionHandler?: (callback) => Promise<void>) => Promise<void>,
    save: (model: TModel, transactionHandler?: (callback) => Promise<void>) => Promise<TModel>,
    search: <TItem>(dto: SearchInputDto, searchQuery: SearchQuery<TModel>) => Promise<SearchResultDto<TModel | IType<TItem>>>,
    softRemove: (id: number, transactionHandler?: (callback: () => Promise<void>) => Promise<void>) => Promise<void>,
    update: (id: number, model: TModel, transactionHandler?: (callback) => Promise<void>) => Promise<TModel>,
}
